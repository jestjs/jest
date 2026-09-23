/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Test} from '@jest/test-result';
import {createScriptTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import Resolver from 'jest-resolve';
import {isError} from 'jest-util';
import prettyFormat from 'pretty-format';

// Passed to the transformer for hooks that are ES modules, mirroring the caller
// flags `jest-runtime` uses for test modules. Transpiling them to CommonJS
// instead would break `import.meta`. The remaining options repeat the defaults
// `requireAndTranspileModule` applies on its own.
const esmTransformOptions = {
  applyInteropRequireDefault: true,
  instrument: false,
  supportsDynamicImport: true,
  supportsExportNamespaceFrom: true,
  supportsStaticESM: true,
  supportsTopLevelAwait: true,
};

function shouldLoadHookAsEsm(
  modulePath: string,
  projectConfig: Config.ProjectConfig,
): boolean {
  // Hooks run in the main process and are evaluated through `require`, so the
  // only way to load an ES module is Node's `require(esm)` support. The flag
  // is not part of `@types/node` yet, and it is `undefined` on Node versions
  // that cannot do this at all.
  const canRequireEsm =
    (process.features as {require_module?: boolean}).require_module === true;

  return (
    canRequireEsm &&
    // The same predicate `jest-runtime` uses for test modules. It only reports
    // `true` when `vm` modules are available, i.e. when jest is run the way ESM
    // is supported at all (`--experimental-vm-modules`).
    Resolver.unstable_shouldLoadAsEsm(
      modulePath,
      projectConfig.extensionsToTreatAsEsm,
    )
  );
}

export default async function runGlobalHook({
  allTests,
  globalConfig,
  moduleName,
}: {
  allTests: Array<Test>;
  globalConfig: Config.GlobalConfig;
  moduleName: 'globalSetup' | 'globalTeardown';
}): Promise<void> {
  const globalModulePaths = new Set(
    allTests.map(test => test.context.config[moduleName]),
  );

  if (globalConfig[moduleName]) {
    globalModulePaths.add(globalConfig[moduleName]);
  }

  if (globalModulePaths.size > 0) {
    for (const modulePath of globalModulePaths) {
      if (!modulePath) {
        continue;
      }

      const correctConfig = allTests.find(
        t => t.context.config[moduleName] === modulePath,
      );

      const projectConfig = correctConfig
        ? correctConfig.context.config
        : // Fallback to first config
          allTests[0].context.config;

      const transformer = await createScriptTransformer(projectConfig);

      try {
        await transformer.requireAndTranspileModule(
          modulePath,
          async globalModule => {
            if (typeof globalModule !== 'function') {
              throw new TypeError(
                `${moduleName} file must export a function at ${modulePath}`,
              );
            }

            await globalModule(globalConfig, projectConfig);
          },
          shouldLoadHookAsEsm(modulePath, projectConfig)
            ? esmTransformOptions
            : undefined,
        );
      } catch (error) {
        if (
          isError(error) &&
          (Object.getOwnPropertyDescriptor(error, 'message')?.writable ||
            Object.getOwnPropertyDescriptor(
              Object.getPrototypeOf(error),
              'message',
            )?.writable)
        ) {
          error.message = `Jest: Got error running ${moduleName} - ${modulePath}, reason: ${error.message}`;

          throw error;
        }

        throw new Error(
          `Jest: Got error running ${moduleName} - ${modulePath}, reason: ${prettyFormat(
            error,
            {maxDepth: 3},
          )}`,
          {cause: error},
        );
      }
    }
  }
}
