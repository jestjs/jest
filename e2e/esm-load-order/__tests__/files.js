/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import '../mixed-package/file1.js';
import '../pure-esm/file3.js';

it('load order is preserved', () =>
  expect(globalThis.Registrar['file1']).toEqual({}));
