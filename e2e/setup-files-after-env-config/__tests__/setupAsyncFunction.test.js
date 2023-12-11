/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('setupFilesAfterEnv', () => {
  it('has waited for async function', () => {
    expect(globalThis.afterEnvAsyncFunctionFinished).toBe(true);
  });
});
