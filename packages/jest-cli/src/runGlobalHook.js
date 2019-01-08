/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {GlobalConfig} from 'types/Config';
import type {Test} from 'types/TestRunner';

export default ({
  allTests,
  globalConfig,
  moduleName,
}: {
  allTests: Array<Test>,
  globalConfig: GlobalConfig,
  moduleName: 'globalSetup' | 'globalTeardown',
}): Promise<?(any[])> => {
  const globalModulePaths = new Set(
    allTests.map(test => test.context.config[moduleName]),
  );

  if (globalConfig[moduleName]) {
    globalModulePaths.add(globalConfig[moduleName]);
  }

  if (globalModulePaths.size > 0) {
    return Promise.all(
      Array.from(globalModulePaths).map(async modulePath => {
        if (!modulePath) {
          return null;
        }

        // $FlowFixMe
        const globalModule = require(modulePath);

        if (typeof globalModule !== 'function') {
          throw new TypeError(
            `${moduleName} file must export a function at ${modulePath}`,
          );
        }

        return globalModule(globalConfig);
      }),
    );
  }

  return Promise.resolve();
};
