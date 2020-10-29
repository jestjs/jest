/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import pluginTester from 'babel-plugin-tester';
import {format as formatCode} from 'prettier';
import babelPluginJestHoist from '..';

const fakeAbsolutPath = path.resolve(__dirname, '../file.js');

pluginTester({
  plugin: babelPluginJestHoist,
  pluginName: 'babel-plugin-jest-hoist',
  tests: {
    'automatic react runtime': {
      babelOptions: {
        babelrc: false,
        configFile: false,
        filename: fakeAbsolutPath,
        presets: [
          [
            require.resolve('@babel/preset-react'),
            {development: true, runtime: 'automatic'},
          ],
        ],
      },
      code: `
        jest.mock('./App', () => () => <div>Hello world</div>);
      `,
      formatResult(code) {
        // replace the filename with something that will be the same across OSes and machine
        const codeWithoutSystemPath = code.replace(
          new RegExp(fakeAbsolutPath, 'g'),
          '/root/project/src/file.js',
        );

        return formatCode(codeWithoutSystemPath, {parser: 'babel'});
      },
      snapshot: true,
    },
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
