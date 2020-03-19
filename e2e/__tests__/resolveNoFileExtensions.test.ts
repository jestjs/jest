/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';
import {cleanup, extractSummary, writeFiles} from '../Utils';

const DIR = path.resolve(__dirname, '../resolve-no-extensions-no-js');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('show error message with matching files', () => {
  const {exitCode, stderr} = runJest('resolve-no-extensions');
  const {rest} = extractSummary(stderr);

  expect(exitCode).toBe(1);

  if (process.platform === 'win32') {
    expect(wrap(rest)).toMatchInlineSnapshot(`
      FAIL __tests__/test.js
        ● Test suite failed to run

          Cannot find module './some-json-file' from 'index.js'

          Require stack:
            index.js
            __tests__\\test.js


          However, Jest was able to find:
          	'./some-json-file.json'

          You might want to include a file extension in your import, or update your 'moduleFileExtensions', which is currently ['js'].

          See https://jestjs.io/docs/en/configuration#modulefileextensions-arraystring

            6 |  */
            7 | 
          > 8 | module.exports = require('./some-json-file');
              |                  ^
            9 | 

            at Resolver.resolveModule (../../packages/jest-resolve/build/index.js:282:11)
            at Object.require (index.js:8:18)
    `);
    return;
  }

  expect(wrap(rest)).toMatchInlineSnapshot(`
    FAIL __tests__/test.js
      ● Test suite failed to run

        Cannot find module './some-json-file' from 'index.js'

        Require stack:
          index.js
          __tests__/test.js


        However, Jest was able to find:
        	'./some-json-file.json'

        You might want to include a file extension in your import, or update your 'moduleFileExtensions', which is currently ['js'].

        See https://jestjs.io/docs/en/configuration#modulefileextensions-arraystring

          6 |  */
          7 | 
        > 8 | module.exports = require('./some-json-file');
            |                  ^
          9 | 

          at Resolver.resolveModule (../../packages/jest-resolve/build/index.js:282:11)
          at Object.require (index.js:8:18)
  `);
});

test('show error message when no js moduleFileExtensions', () => {
  writeFiles(DIR, {
    'index.jsx': `
      module.exports ={found: true};
    `,
    'package.json': `
      {
        "jest": {
          "moduleFileExtensions": ["jsx"]
        }
      }
    `,
    'test.jsx': `
      const m = require('../');

      test('some test', () => {
        expect(m.found).toBe(true);
      });
    `,
  });

  const {exitCode, stderr} = runJest('resolve-no-extensions-no-js');

  expect(exitCode).toBe(1);
  expect(wrap(stderr)).toMatchSnapshot();
});
