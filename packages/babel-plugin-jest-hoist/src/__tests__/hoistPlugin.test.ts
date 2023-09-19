/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import pluginTester from 'babel-plugin-tester';
import {format as formatCode, resolveConfig} from 'prettier';
import babelPluginJestHoist from '..';

const prettierOptions = {
  ...resolveConfig.sync(__filename),
  filepath: __filename,
};

const formatResult = (code: string) => formatCode(code, prettierOptions);

pluginTester({
  plugin: babelPluginJestHoist,
  pluginName: 'babel-plugin-jest-hoist',
  tests: {
    /* eslint-disable sort-keys */
    'automatic react runtime': {
      babelOptions: {
        babelrc: false,
        configFile: false,
        filename: path.resolve(__dirname, '../file.js'),
        presets: [
          [
            require.resolve('@babel/preset-react'),
            {development: true, runtime: 'automatic'},
          ],
        ],
      },
      code: formatResult(`
        jest.mock('./App', () => () => <div>Hello world</div>);
      `),
      formatResult(code) {
        // replace the filename with something that will be the same across OSes and machine
        const codeWithoutSystemPath = code.replace(
          /var _jsxFileName = ".*";/,
          'var _jsxFileName = "/root/project/src/file.js";',
        );

        return formatResult(codeWithoutSystemPath);
      },
      snapshot: true,
    },
    'top level mocking': {
      code: formatResult(`
        require('x');

        jest.enableAutomock();
        jest.disableAutomock();
      `),
      formatResult,
      snapshot: true,
    },
    'within a block': {
      code: formatResult(`
        beforeEach(() => {
          require('x')
          jest.mock('someNode')
        })
      `),
      formatResult,
      snapshot: true,
    },
    'within a block with no siblings': {
      code: formatResult(`
        beforeEach(() => {
          jest.mock('someNode')
        })
      `),
      formatResult,
      snapshot: true,
    },

    'required `jest` within `jest`': {
      code: formatResult(`
        const {jest} = require('@jest/globals');

        jest.mock('some-module', () => {
          jest.requireActual('some-module');
        });
      `),
      formatResult,
      snapshot: true,
    },
    'imported jest.mock within jest.mock': {
      code: formatResult(`
        import {jest} from '@jest/globals';

        jest.mock('some-module', () => {
          jest.mock('some-module');
        });
      `),
      formatResult,
      snapshot: true,
    },
    'global jest.mock within jest.mock': {
      code: formatResult(`
        jest.mock('some-module', () => {
          jest.mock('some-module');
        });
      `),
      formatResult,
      snapshot: true,
    },
    'imported jest.requireActual in jest.mock': {
      code: formatResult(`
        import {jest} from '@jest/globals';

        jest.mock('some-module', () => {
          jest.requireActual('some-module');
        });

        jest.requireActual('some-module');
      `),
      formatResult,
      snapshot: true,
    },
    'global jest.requireActual in jest.mock': {
      code: formatResult(`
        jest.mock('some-module', () => {
          jest.requireActual('some-module');
        });

        jest.requireActual('some-module');
      `),
      formatResult,
      snapshot: true,
    },
    'TS typeof usage in jest.mock': {
      babelOptions: {
        babelrc: false,
        configFile: false,
        filename: path.resolve(__dirname, '../file.ts'),
        presets: [[require.resolve('@babel/preset-typescript')]],
      },
      code: formatResult(`
        jest.mock('some-module', () => {
          const actual = jest.requireActual('some-module');

          return jest.fn<typeof actual.method>();
        });
      `),
      formatResult,
      snapshot: true,
    },
    'jest.spyOn call on the imported module': {
      code: formatResult(`
        jest.mock('some-module', () => {
          const module = jest.requireActual('some-module');
          jest.spyOn(module, 'add');
          return module;
        });
      `),
      formatResult,
      snapshot: true,
    },
    'jest.spyOn call in class constructor': {
      code: formatResult(`
        jest.mock('some-module', () => {
          const Actual = jest.requireActual('some-module');
          return class Mocked extends Actual {
            constructor() {
              super();
              jest.spyOn(this, 'add');
            }
          };
        });
      `),
      formatResult,
      snapshot: true,
    },
  },
  /* eslint-enable */
});
