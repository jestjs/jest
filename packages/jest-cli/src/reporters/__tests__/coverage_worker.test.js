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
  worker = require('../coverage_worker').worker;
});

test('resolves to the result of generateEmptyCoverage upon success', async () => {
  expect.assertions(2);

  const validJS = 'function(){}';

  fs.readFileSync.mockImplementation(() => validJS);
  generateEmptyCoverage.mockImplementation(() => 42);

  const result = await worker(workerOptions);

  expect(generateEmptyCoverage).toBeCalledWith(
    validJS,
    'banana.js',
    globalConfig,
    config,
  );

  expect(result).toEqual(42);
});

test('throws errors on invalid JavaScript', async () => {
  expect.assertions(1);

  generateEmptyCoverage.mockImplementation(() => {
    throw new Error('SyntaxError');
  });

  let error = null;

  try {
    await worker(workerOptions);
  } catch (err) {
    error = err;
  }

  expect(error).toBeInstanceOf(Error);
});
