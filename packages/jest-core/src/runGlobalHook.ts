/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extname} from 'path';
import {addHook} from 'pirates';
import {Config} from '@jest/types';
import {Test} from 'jest-runner';
import {ScriptTransformer} from '@jest/transform';
import {interopRequireDefault} from 'jest-util';

// Needed , revert to normal import when drop node 6 and upgrade p-each-series 2.1.0
const pEachSeries = require('p-each-series') as <ValueType>(
  input: Iterable<PromiseLike<ValueType> | ValueType>,
  iterator: (element: ValueType, index: number) => unknown,
) => Promise<Array<ValueType>>;

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
    await pEachSeries(
      Array.from(globalModulePaths),
      async (modulePath: string | null | undefined) => {
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

        const transformer = new ScriptTransformer(projectConfig);

        // Load the transformer to avoid a cycle where we need to load a
        // transformer in order to transform it in the require hooks
        transformer.preloadTransformer(modulePath);

        let transforming = false;
        const revertHook = addHook(
          (code, filename) => {
            try {
              transforming = true;
              return (
                transformer.transformSource(filename, code, false).code || code
              );
            } finally {
              transforming = false;
            }
          },
          {
            exts: [extname(modulePath)],
            ignoreNodeModules: false,
            matcher: (...args) => {
              if (transforming) {
                // Don't transform any dependency required by the transformer itself
                return false;
              }
              return transformer.shouldTransform(...args);
            },
          },
        );

        const globalModule = interopRequireDefault(require(modulePath)).default;

        if (typeof globalModule !== 'function') {
          throw new TypeError(
            `${moduleName} file must export a function at ${modulePath}`,
          );
        }

        await globalModule(globalConfig);

        revertHook();
      },
    );
  }

  return Promise.resolve();
};
