/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { wrap } from 'jest-snapshot-serializer-raw';
import * as path from 'path';
import runJest, { json as runWithJson } from '../runJest';
import {
  runYarnInstall
} from '../Utils';

describe('babel-jest', () => {
  const dir = path.resolve(__dirname, '..', 'transform/babel-jest');

  beforeEach(() => {
    runYarnInstall(dir);
  });

  it('runs transpiled code', () => {
    // --no-cache because babel can cache stuff and result in false green
    const {json} = runWithJson(dir, ['--no-cache']);
    expect(json.success).toBe(true);
    expect(json.numTotalTests).toBeGreaterThanOrEqual(2);
  });

  it('instruments only specific files and collects coverage', () => {
    const {stdout} = runJest(dir, ['--coverage', '--no-cache'], {
      stripAnsi: true,
    });
    expect(stdout).toMatch('covered.js');
    expect(stdout).not.toMatch('notCovered.js');
    expect(stdout).not.toMatch('excludedFromCoverage.js');
    // coverage result should not change
    expect(wrap(stdout)).toMatchSnapshot();
  });
});
