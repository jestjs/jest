/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

describe('describe throw does not warn', () => {
  it('t', () => {});
  throw new Error('whoops');
});
