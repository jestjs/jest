/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import pluginTester from 'babel-plugin-tester';
import babelPluginJestHoist from '..';

pluginTester({
  plugin: babelPluginJestHoist,
  pluginName: 'babel-plugin-jest-hoist',
  tests: {
    'top level mocking': {
      code: `
        require('x');

        jest.enableAutomock();
        jest.disableAutomock();
      `,
      snapshot: true,
    },
    'within a block': {
      code: `
        beforeEach(() => {
          require('x')
          jest.mock('someNode')
        })
      `,
      snapshot: true,
    },
    'within a block with no siblings': {
      code: `
        beforeEach(() => {
          jest.mock('someNode')
        })
      `,
      snapshot: true,
    },
  },
});
