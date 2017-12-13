/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import runJest from '../runJest';

test('overriding native promise does not freeze Jest', () => {
  const run = runJest('override-globals');
  expect(run.stderr).toMatch(/PASS __tests__(\/|\\)index.js/);
});
