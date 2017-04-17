/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.mock('fs').mock('../../generateEmptyCoverage');

const fs = require('fs');
const generateEmptyCoverage = require('../../generateEmptyCoverage');

const config = {collectCoverage: true};
const worker = require('../CoverageWorker');
const workerOptions = {config, untestedFilePath: 'asdf'};

describe('CoverageWorker', () => {
  it('resolves to the result of generateEmptyCoverage upon success', () => {
    const validJS = 'function(){}';
    fs.readFileSync.mockImplementation(() => validJS);
    generateEmptyCoverage.mockImplementation(() => 42);
    return new Promise(resolve => {
      worker(workerOptions, (err, result) => {
        expect(generateEmptyCoverage).toBeCalledWith(validJS, 'asdf', config);
        expect(result).toEqual(42);
        resolve();
      });
    });
  });

  it('surfaces a serializable error', () => {
    fs.readFileSync.mockImplementation(() => 'invalidJs');
    return new Promise(resolve => {
      worker(workerOptions, (err, result) => {
        expect(err).toEqual(JSON.parse(JSON.stringify(err)));
        expect(result).toEqual(undefined);
        resolve();
      });
    });
  });
});
