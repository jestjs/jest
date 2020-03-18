/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

it('should surface pnp errors', () => {
  try {
    require('undeclared');
    throw new Error('UNDECLARED_DEPENDENCY should have been thrown');
  } catch (error) {
    expect(error.code).toBe('UNDECLARED_DEPENDENCY');
  }
});
