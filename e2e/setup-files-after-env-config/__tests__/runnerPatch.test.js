/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('setupFile', () => {
  it('patches jasmine in setup file', () => {
    expect(globalThis.describeDefined).toBe(true);
  });
});
