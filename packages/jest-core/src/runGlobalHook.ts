/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as util from 'util';
import type {Test} from '@jest/test-result';
import {createScriptTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import prettyFormat from 'pretty-format';

export default async function runGlobalHook({
  allTests,
  globalConfig,
  moduleName,
}: {
  allTests: Array<Test>;
  globalConfig: Config.GlobalConfig;
  moduleName: 'globalSetup' | 'globalTeardown';
}): Promise<void> {
  const {configs} = allTests.reduce<{
    ids: Array<string>;
    configs: Array<Config.ProjectConfig>;
  }>(
    (acc, test) => {
      const hook = test.context.config[moduleName];
      if (!hook) return acc;

      const id = test.context.config.id;
      const registered = acc.ids.includes(id);
      if (registered) return acc;

      acc.ids.push(id);
      acc.configs.push(test.context.config);
      return acc;
    },
    {configs: [], ids: []},
  );

  if (globalConfig[moduleName]) {
    configs.push({
      ...allTests[0].context.config,
      [moduleName]: globalConfig[moduleName],
    });
  }

  if (configs.length > 0) {
    for (const config of configs) {
      const modulePath = config[moduleName];
      if (!modulePath) {
        continue;
      }

      const transformer = await createScriptTransformer(config);

      try {
        await transformer.requireAndTranspileModule(
          modulePath,
          async globalModule => {
            if (typeof globalModule !== 'function') {
              throw new TypeError(
                `${moduleName} file must export a function at ${modulePath}`,
              );
            }

            await globalModule(globalConfig, config);
          },
        );
      } catch (error) {
        if (
          util.types.isNativeError(error) &&
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
        );
      }
    }
  }
}
