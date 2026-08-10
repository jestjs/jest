/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Constants} from '../deepReexport.js';

test('can reexport deep CJS requires', () => {
  expect(Constants).toHaveProperty('NonSystemMessageTypes');
});
