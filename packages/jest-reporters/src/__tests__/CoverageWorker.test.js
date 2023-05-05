/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('graceful-fs').mock('../generateEmptyCoverage');

const globalConfig = {collectCoverage: true};
const config = {};
const context = {};
const workerOptions = {config, context, globalConfig, path: 'banana.js'};

let fs;
let generateEmptyCoverage;
let worker;

beforeEach(() => {
  jest.resetModules();

  fs = require('graceful-fs');
  generateEmptyCoverage = require('../generateEmptyCoverage').default;
  worker = require('../CoverageWorker').worker;
});

test('resolves to the result of generateEmptyCoverage upon success', async () => {
  expect.assertions(2);

  const validJS = 'function(){}';

  fs.readFileSync.mockImplementation(() => validJS);
  generateEmptyCoverage.mockImplementation(() => 42);

  const result = await worker(workerOptions);

  expect(generateEmptyCoverage).toHaveBeenCalledWith(
    validJS,
    'banana.js',
    globalConfig,
    config,
    undefined,
    undefined,
  );

  expect(result).toBe(42);
});

test('throws errors on invalid JavaScript', async () => {
  expect.assertions(1);

  generateEmptyCoverage.mockImplementation(() => {
    throw new Error('SyntaxError');
  });

  // We intentionally expect the worker to fail!
  try {
    await worker(workerOptions);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
});
