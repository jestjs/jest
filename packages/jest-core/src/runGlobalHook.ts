/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as util from 'util';
import pEachSeries = require('p-each-series');
import {ScriptTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import type {Test} from 'jest-runner';
import {interopRequireDefault} from 'jest-util';
import prettyFormat from 'pretty-format';

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

      const transformer = new ScriptTransformer(projectConfig);

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
        if (util.types.isNativeError(error)) {
          throw error;
        }

        throw new Error(
          `Got error running ${moduleName} - ${modulePath}, reason: ${prettyFormat(
            error,
            {maxDepth: 3},
          )}`,
        );
      }
    });
  }

  return Promise.resolve();
};
