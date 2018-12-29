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

import {extname, resolve, sep} from 'path';
import pEachSeries from 'p-each-series';
import {addHook} from 'pirates';
import {ScriptTransformer} from 'jest-runtime';

const inJestsSource = __dirname.includes(`packages${sep}jest-cli`);
let packagesRoot;

if (inJestsSource) {
  packagesRoot = resolve(__dirname, '../../');
}

export default ({
  allTests,
  globalConfig,
  moduleName,
}: {
  allTests: Array<Test>,
  globalConfig: GlobalConfig,
  moduleName: 'globalSetup' | 'globalTeardown',
}): Promise<void> => {
  const globalModulePaths = new Set(
    allTests.map(test => test.context.config[moduleName]),
  );

  if (globalConfig[moduleName]) {
    globalModulePaths.add(globalConfig[moduleName]);
  }

  if (globalModulePaths.size > 0) {
    return pEachSeries(Array.from(globalModulePaths), async modulePath => {
      if (!modulePath) {
        return;
      }

      const projectConfig =
        allTests
          .map(t => t.context.config)
          .find(c => c[moduleName] === modulePath) ||
        // Fallback to first one
        allTests[0].context.config;

      const transformer = new ScriptTransformer(projectConfig);

      const revertHook = addHook(
        (code, filename) =>
          transformer.transformSource(filename, code, false).code || code,
        {
          exts: [extname(modulePath)],
          matcher(filename) {
            // `babel-jest` etc would normally be caught by `node_modules`, but not in Jest's own repo
            if (inJestsSource && filename.includes(packagesRoot)) {
              return false;
            }
            return transformer._shouldTransform(filename);
          },
        },
      );

      // $FlowFixMe
      const globalModule = require(modulePath);

      if (typeof globalModule !== 'function') {
        throw new TypeError(
          `${moduleName} file must export a function at ${modulePath}`,
        );
      }

      await globalModule(globalConfig);

      revertHook();
    });
  }

  return Promise.resolve();
};
