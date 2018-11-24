/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import path from 'path';
import {run} from '../../cli';

const runProject = path.join(__dirname, '../__fixtures__/run');

jest.mock('exit');

const runArgvString = [
  '--config',
  JSON.stringify({
    rootDir: runProject,
    testMatch: ['<rootDir>/*_spec.js'],
    transform: {
      '^.+\\.jsx?$': './transform-module',
    },
  }),
];

const runArgvObject = [
  '--config',
  {
    rootDir: runProject,
    testMatch: ['<rootDir>/*_spec.js'],
    transform: {
      '^.+\\.jsx?$': './transform-module',
    },
  },
];

const processOnFn = process.on;
const processExitFn = process.exit;
const processErrWriteFn = process.stderr.write;
const consoleErrorFn = console.error;

const noSubTestLogs = true;

describe('run', () => {
  beforeEach(() => {
    process.on = jest.fn();
    process.on.mockReset();
    process.exit = jest.fn();
    process.exit.mockReset();
    if (noSubTestLogs) {
      process.stderr.write = jest.fn();
      process.stderr.write.mockReset();
      console.error = jest.fn();
      console.error.mockReset();
    }
  });

  afterEach(() => {
    process.on = processOnFn;
    process.exit = processExitFn;
    if (noSubTestLogs) {
      process.stderr.write = processErrWriteFn;
      console.error = consoleErrorFn;
    }
  });

  describe('config as string', () => {
    it('passes the test when the config has a transform module path', async () => {
      let runResult = null;
      let error = null;
      try {
        runResult = await run(runArgvString, runProject);
      } catch (ex) {
        error = ex;
      }
      const numPassedTests = runResult ? runResult.numPassedTests : -1;
      expect(error).toBe(null);
      expect(numPassedTests).toBe(1);
    });
  });

  describe('config as object', () => {
    it('throws running the test when the config is an object', async () => {
      let runResult = null;
      let error = null;
      try {
        runResult = await run(runArgvObject, runProject);
      } catch (ex) {
        error = ex;
      }
      const numPassedTests = runResult ? runResult.numPassedTests : -1;
      expect(error).not.toBe(null);
      expect(numPassedTests).toBe(-1);
    });
  });
});
