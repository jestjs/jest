/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import path from 'path';
import { runCLI } from '../../cli';

const project = path.join(__dirname, '../__fixtures__/runCLI');
const projects = [project];

const argv = {
  config: {
    testMatch: [
      "<rootDir>/*_spec.js"
    ],
    transform: {
      "^.+\\.jsx?$": () => {
        return {
          process(src, filename) {
            return src.replace('toReplace', 'replaced');
          },
        };
      }
    }
  },
};

describe('runCLI', () => {
  describe('config as object', () => {
    it('runs jest with a standalone config object', async () => {
      let runResult = null;
      let error = null;
      try {
        runResult = await runCLI(argv, projects);
      }
      catch (ex) {
        error = ex;
      }
      let numPassedTests = runResult ? runResult.results.numPassedTests : -1;
      expect(error).toBe(null);
      expect(numPassedTests).toBe(1);
    })
  })
});

