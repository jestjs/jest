/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import { json as runWithJson } from '../runJest';
import {
  runYarnInstall
} from '../Utils';

describe('multiple-transformers', () => {
  const dir = path.resolve(__dirname, '..', 'transform/multiple-transformers');

  beforeEach(() => {
    runYarnInstall(dir);
  });

  it('transforms dependencies using specific transformers', () => {
    const {json, stderr} = runWithJson(dir, ['--no-cache']);

    expect(stderr).toMatch(/PASS/);
    expect(json.numTotalTests).toBe(1);
    expect(json.numPassedTests).toBe(1);
  });
});

