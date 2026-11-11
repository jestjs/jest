/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import prettier from '@prettier/sync';
import pluginTester from 'babel-plugin-tester';
import type {Options} from 'prettier';
import babelPluginJestHoist from '..';

const prettierOptions: Options = {
  ...prettier.resolveConfig(__filename),
  filepath: __filename,
  parser: 'babel-ts',
};

const formatResult = (code: string) => prettier.format(code, prettierOptions);

describe('babel 7', () => {
  defineTests({
    babel: require('@babel/core'),
    presetReact: require('@babel/preset-react').default,
    presetTypescript: require('@babel/preset-typescript').default,
  });
});

export function defineTests({
  babel,
  presetReact,
  presetTypescript,
}: {
  babel: typeof import('@babel/core');
  presetReact: any;
  presetTypescript: any;
}) {
  pluginTester({
    babel,
    plugin: babelPluginJestHoist,
    pluginName: 'babel-plugin-jest-hoist',
    tests: {
      /* eslint-disable sort-keys */
      'automatic react runtime': {
        babelOptions: {
          babelrc: false,
          configFile: false,
          filename: path.resolve(__dirname, '../file.js'),
          presets: [[presetReact, {development: true, runtime: 'automatic'}]],
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
          presets: [presetTypescript],
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
      'jest.hoisted const factory': {
        code: formatResult(`
          const { mockGet } = jest.hoisted(() => ({ mockGet: jest.fn() }));

          jest.mock('./api', () => ({ get: mockGet }));
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted let factory': {
        code: formatResult(`
          let label = jest.hoisted(() => 'hoisted-label');
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted var factory': {
        code: formatResult(`
          var label = jest.hoisted(() => 'hoisted-label');
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted multi declarators preserves whole statement': {
        code: formatResult(`
          const a = jest.hoisted(() => 1), b = 2;
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted bare call hoists like jest.mock': {
        code: formatResult(`
          require('x');
          jest.hoisted(() => globalThis.__seeded__ = true);
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted bare call rewrites jest refs in factory': {
        code: formatResult(`
          require('x');
          jest.hoisted(() => { globalThis.__fn__ = jest.fn(); });
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted rewrites jest refs in factory body': {
        code: formatResult(`
          const { mockFn } = jest.hoisted(() => ({ mockFn: jest.fn() }));
          jest.mock('./api', () => ({ get: mockFn }));
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted throws when nested inside a block': {
        code: 'if (true) { const x = jest.hoisted(() => 1); }',
        error: /must be called at the top level of the file/,
      },
      'jest.hoisted throws when factory argument is not a function': {
        code: 'const x = jest.hoisted({ value: 1 });',
        error: /must be an inline function/,
      },
      'jest.hoisted throws when called with no arguments': {
        code: 'const x = jest.hoisted();',
        error: /must be called with exactly one argument/,
      },
      'jest.hoisted preserves relative order of multiple declarations': {
        code: formatResult(`
          require('x');
          const a = jest.hoisted(() => 1);
          const b = jest.hoisted(() => 2);
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted with destructuring': {
        code: formatResult(`
          const { one, two } = jest.hoisted(() => ({ one: 1, two: 2 }));
          jest.mock('./api', () => ({ one, two }));
        `),
        formatResult,
        snapshot: true,
      },
      'jest.mock can reference jest.hoisted binding declared later in file': {
        code: formatResult(`
          jest.mock('./api', () => ({ get: mockGet }));

          const { mockGet } = jest.hoisted(() => ({ mockGet: jest.fn() }));
        `),
        formatResult,
        snapshot: true,
      },
      'jest.hoisted called inside jest.mock factory throws': {
        code: "jest.mock('./api', () => { jest.hoisted(() => 1); return {}; });",
        error: /must be called at the top level of the file/,
      },
      'jest.mock called inside jest.hoisted factory throws': {
        code: "jest.hoisted(() => { jest.mock('./api', () => ({})); return 1; });",
        error: /`jest\.mock` cannot be called inside a `jest\.hoisted` factory/,
      },
      'jest.hoisted called inside another jest.hoisted factory throws': {
        code: 'jest.hoisted(() => { jest.hoisted(() => 1); return 1; });',
        error:
          /`jest\.hoisted` cannot be called inside a `jest\.hoisted` factory/,
      },
      'jest.hoisted and jest.mock preserve source order when interleaved': {
        code: formatResult(`
          require('x');
          jest.hoisted(() => globalThis.__a__ = 1);
          jest.mock('./first', () => ({ value: 'first' }));
          jest.hoisted(() => globalThis.__b__ = 2);
          jest.mock('./second', () => ({ value: 'second' }));
        `),
        formatResult,
        snapshot: true,
      },
    },
    /* eslint-enable */
  });
}
