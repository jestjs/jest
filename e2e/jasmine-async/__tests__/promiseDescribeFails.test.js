/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

// TODO after dropping Node 6: Convert to async-await
// describe('Promise describe fails', async () => {
//   await Promise.resolve();
//   it('not declared', () => {});
// });

describe('Promise describe fails', () =>
  Promise.resolve().then(() => {
    it('not declared', () => {});
  }));
