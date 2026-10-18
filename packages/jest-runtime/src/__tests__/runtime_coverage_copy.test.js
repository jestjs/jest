/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

let createRuntime;

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('getAllCoverageInfoCopy', () => {
    it('returns undefined when no coverage was collected', async () => {
      const runtime = await createRuntime(__filename);
      delete runtime._environment.global.__coverage__;
      expect(runtime.getAllCoverageInfoCopy()).toBeUndefined();
    });

    it('returns a deep copy that does not change with the original', async () => {
      const runtime = await createRuntime(__filename);
      const fileCoverage = {
        b: {0: [0, 0]},
        branchMap: {0: {locations: [], type: 'if'}},
        f: {0: 1},
        fnMap: {0: {name: 'sum'}},
        inputSourceMap: {mappings: 'AAAA', sources: ['sum.ts'], version: 3},
        path: '/sum.js',
        s: {0: 1, 1: 0},
        statementMap: {0: {end: {column: 1, line: 1}}},
      };
      runtime._environment.global.__coverage__ = {'/sum.js': fileCoverage};

      const copy = runtime.getAllCoverageInfoCopy();
      expect(copy).toEqual({'/sum.js': fileCoverage});

      fileCoverage.s[1] = 5;
      fileCoverage.b[0][1] = 2;
      expect(copy['/sum.js'].s[1]).toBe(0);
      expect(copy['/sum.js'].b[0]).toEqual([0, 0]);
      expect(copy['/sum.js']).not.toBe(fileCoverage);
    });
  });
});
