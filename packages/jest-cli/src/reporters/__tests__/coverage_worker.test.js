/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('fs').mock('../../generate_empty_coverage');

const globalConfig = {collectCoverage: true};
const config = {};
const workerOptions = {config, globalConfig, path: 'banana.js'};

let fs;
let generateEmptyCoverage;
let worker;

beforeEach(() => {
  jest.resetModules();

  fs = require('fs');
  generateEmptyCoverage = require('../../generate_empty_coverage').default;
  worker = require('../coverage_worker');
});

test('resolves to the result of generateEmptyCoverage upon success', () => {
  expect.assertions(2);
  const validJS = 'function(){}';
  fs.readFileSync.mockImplementation(() => validJS);
  generateEmptyCoverage.mockImplementation(() => 42);
  return new Promise((resolve, reject) => {
    worker(workerOptions, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      expect(generateEmptyCoverage).toBeCalledWith(
        validJS,
        'banana.js',
        globalConfig,
        config,
      );
      expect(result).toEqual(42);
      resolve();
    });
  });
});

test('throws errors on invalid JavaScript', () => {
  expect.assertions(2);
  generateEmptyCoverage.mockImplementation(() => {
    throw new Error('SyntaxError');
  });
  return new Promise((resolve, reject) => {
    worker(workerOptions, (error, result) => {
      if (!error) {
        reject(result);
        return;
      }

      expect(error.message).toMatch(
        'Failed to collect coverage from banana.js',
      );
      expect(result).toEqual(undefined);
      resolve();
    });
  });
});
