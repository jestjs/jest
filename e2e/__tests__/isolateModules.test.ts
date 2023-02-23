/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, createEmptyPackage, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'isolate-modules.test');

beforeEach(() => {
  cleanup(DIR);
  createEmptyPackage(DIR);
});

afterAll(() => cleanup(DIR));

test('works with mocks', () => {
  writeFiles(DIR, {
    'config.js': `
      module.exports.getBoolean = function getBoolean(variableName) {
        return false;
      }
    `,
    'read.js': `
      const {getBoolean} = require('./config');

      const value = getBoolean('foo');
      console.log("was " + value);
    `,
    'test.js': `
      jest.mock('./config');
      const config = require('./config');

      test('dummy test', () => {
        const configGetMock = config.getBoolean.mockImplementation(() => {
          return true;
        });

        jest.isolateModules(() => {
          require("./read");
        });

        expect(configGetMock).toBeCalledTimes(1);
      })
    `,
  });
  const {exitCode} = runJest(DIR);

  expect(exitCode).toBe(0);
});
