/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {pathToFileURL} from 'url';
import * as util from 'util';
import pEachSeries = require('p-each-series');
import {createScriptTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import type {Test} from 'jest-runner';
import {interopRequireDefault} from 'jest-util';
import {format as prettyFormat} from 'pretty-format';

export default async ({
  allTests,
  globalConfig,
  moduleName,
}: {
  allTests: Array<Test>;
  globalConfig: Config.GlobalConfig;
  moduleName: 'globalSetup' | 'globalTeardown';
}): Promise<void> => {
  const globalModulePaths = new Set(
    allTests.map(test => test.context.config[moduleName]),
  );

  if (globalConfig[moduleName]) {
    globalModulePaths.add(globalConfig[moduleName]);
  }

  if (globalModulePaths.size > 0) {
    await pEachSeries(globalModulePaths, async modulePath => {
      if (!modulePath) {
        return;
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
        await transformer.requireAndTranspileModule(modulePath, async m => {
          const globalModule = interopRequireDefault(m).default;

          if (typeof globalModule !== 'function') {
            throw new TypeError(
              `${moduleName} file must export a function at ${modulePath}`,
            );
          }

          await globalModule(globalConfig);
        });
      } catch (error) {
        if (error && error.code === 'ERR_REQUIRE_ESM') {
          const configUrl = pathToFileURL(modulePath);

          // node `import()` supports URL, but TypeScript doesn't know that
          const importedConfig = await import(configUrl.href);

          if (!importedConfig.default) {
            throw new Error(
              `Jest: Failed to load ESM transformer at ${modulePath} - did you use a default export?`,
            );
          }

          const globalModule = importedConfig.default;

          if (typeof globalModule !== 'function') {
            throw new TypeError(
              `${moduleName} file must export a function at ${modulePath}`,
            );
          }

          await globalModule(globalConfig);
        } else {
          if (util.types.isNativeError(error)) {
            error.message = `Jest: Got error running ${moduleName} - ${modulePath}, reason: ${error.message}`;

            throw error;
          }

          throw new Error(
            `Jest: Got error running ${moduleName} - ${modulePath}, reason: ${prettyFormat(
              error,
              {maxDepth: 3},
            )}`,
          );
        }
      }
    });
  }

  return Promise.resolve();
};
