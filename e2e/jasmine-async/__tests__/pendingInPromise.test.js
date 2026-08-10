/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

it('skips a test inside a promise', () =>
  new Promise(() => {
    pending('skipped a test inside a promise');
  }));
