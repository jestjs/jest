/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import path from 'path';
import {run, runCLI} from '../../cli';

const runProject = path.join(__dirname, '../__fixtures__/run');
const runCLIProject = path.join(__dirname, '../__fixtures__/runCLI');
const runCLIProjects = [runCLIProject];

const processor = {
  process: (src, filename) => src.replace('toReplace', 'replaced')
};

const runCLIArgv = {
  config: {
    testMatch: ['<rootDir>/*_spec.js'],
    transform: {
      '^.+\\.jsx?$': () => processor
    },
  },
};

const runArgvString = [
  '--config',
  JSON.stringify({
    "rootDir": runProject,
    "testMatch": ["<rootDir>/*_spec.js"],
    "transform": {
      "^.+\\.jsx?$": "./transform-module"
    }
  })
];

const runArgvObject = [
  '--config',
  {
    "rootDir": runProject,
    "testMatch": ["<rootDir>/*_spec.js"],
    "transform": {
      "^.+\\.jsx?$": "./transform-module"
    }
  }
];

describe('runCLI', () => {
  describe('config as object', () => {
    it('passes the test when the config has a transform function', async () => {
      let runResult = null;
      let error = null;
      try {
        runResult = await runCLI(runCLIArgv, runCLIProjects);
      } catch (ex) {
        error = ex;
      }
      const numPassedTests = runResult ? runResult.results.numPassedTests : -1;
      expect(error).toBe(null);
      expect(numPassedTests).toBe(1);
    });
  });
});

describe('run', () => {
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
        runResult = await run(runArgvObject, runProject, false);
      } catch (ex) {
        error = ex;
      }
      const numPassedTests = runResult ? runResult.numPassedTests : -1;
      expect(error).not.toBe(null);
      expect(numPassedTests).toBe(-1);
    });
  });
});
