/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import '../esm-package';
import '../cjs-package';

it('load order is preserved', () =>
  expect(globalThis.Registrar['esm-package']).toEqual({}));
