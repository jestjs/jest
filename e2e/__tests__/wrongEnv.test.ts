/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';
import {extractSummary} from '../Utils';

describe('Wrong globals for environment', () => {
  it('print useful error for window', () => {
    const result = runJest('wrong-env', ['node', '-t=window']);
    expect(result.exitCode).toBe(1);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('print useful error for document', () => {
    const result = runJest('wrong-env', ['node', '-t=document']);
    expect(result.exitCode).toBe(1);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('print useful error for unref', () => {
    const result = runJest('wrong-env', ['jsdom', '-t=unref']);
    expect(result.exitCode).toBe(1);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });

  it('print useful error when it explodes during evaluation', () => {
    const result = runJest('wrong-env', ['beforeTest']);
    expect(result.exitCode).toBe(1);
    expect(extractSummary(result.stderr).rest).toMatchSnapshot();
  });
});
