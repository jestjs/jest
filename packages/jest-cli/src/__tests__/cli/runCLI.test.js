/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import path from 'path';
import {runCLI} from '../../cli';
import transformModule from '../__fixtures__/runCLI/transform-module';

const project = path.join(__dirname, '../__fixtures__/runCLI');
const projects = [project];

const argvObject = {
  config: {
    testMatch: ['<rootDir>/*_spec.js'],
    transform: {
      '^.+\\.jsx?$': () => transformModule,
    },
  },
};

const argvString = {
  config: JSON.stringify({
    rootDir: project,
    testMatch: ['<rootDir>/*_spec.js'],
    transform: {
      '^.+\\.jsx?$': './transform-module',
    },
  }),
};

const processErrWriteFn = process.stderr.write;

const noSubTestLogs = true;

describe('runCLI', () => {
  beforeEach(() => {
    if (noSubTestLogs) {
      process.stderr.write = jest.fn();
      process.stderr.write.mockReset();
    }
  });

  afterEach(() => {
    if (noSubTestLogs) {
      process.stderr.write = processErrWriteFn;
    }
  });

  describe('config as object', () => {
    it('passes the test when the config has a transform function', async () => {
      let runResult = null;
      let error = null;
      try {
        runResult = await runCLI(argvObject, projects);
      } catch (ex) {
        error = ex;
      }
      const numPassedTests = runResult ? runResult.results.numPassedTests : -1;
      expect(error).toBe(null);
      expect(numPassedTests).toBe(1);
    });
  });

  describe('config as string', () => {
    it('passes the test when the config is a string', async () => {
      let runResult = null;
      let error = null;
      try {
        runResult = await runCLI(argvString, projects);
      } catch (ex) {
        error = ex;
      }
      const numPassedTests = runResult ? runResult.results.numPassedTests : -1;
      expect(error).toBe(null);
      expect(numPassedTests).toBe(1);
    });
  });
});
