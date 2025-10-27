/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {onNodeVersions} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

function assertFailuresAndSnapshot(args: Array<string>) {
  const result = runJest('wrong-env', args);
  expect(result.exitCode).toBe(1);
  expect(extractSummary(result.stderr).rest).toMatchSnapshot();
}

describe('Wrong globals for environment', () => {
  it('print useful error for window', () => {
    assertFailuresAndSnapshot(['node', '-t=window']);
  });

  it('print useful error for document', () => {
    assertFailuresAndSnapshot(['node', '-t=document']);
  });

  it('print useful error for unref', () => {
    assertFailuresAndSnapshot(['jsdom', '-t=unref']);
  });

  it('print useful error when it explodes during evaluation', () => {
    assertFailuresAndSnapshot(['beforeTest']);
  });
});
