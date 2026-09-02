/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import runJest, {json as runWithJson, supportsTypeStripping} from '../runJest';

const describeIfSupported = supportsTypeStripping ? describe : describe.skip;

describeIfSupported('native type stripping', () => {
  test('strips types when no transformer claims the file', () => {
    const {exitCode, json} = runWithJson(
      resolve(__dirname, '../native-typescript-strip'),
      [],
      {nodeOptions: '--experimental-vm-modules --no-warnings'},
    );

    expect(exitCode).toBe(0);
    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(2);
  });

  test('points at a real transformer for TypeScript that needs code generation', () => {
    const {exitCode, stderr} = runJest(
      resolve(__dirname, '../native-typescript-strip-unsupported'),
      [],
      {nodeOptions: '--experimental-vm-modules --no-warnings'},
    );

    expect(exitCode).toBe(1);
    expect(stderr).toContain(
      'TypeScript enum is not supported in strip-only mode',
    );
    expect(stderr).toContain('@babel/preset-typescript');
  });
});
