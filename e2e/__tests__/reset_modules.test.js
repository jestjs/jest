/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import runJest from '../runJest';

test('jest.resetModules should not error when _isMockFunction is defined but not boolean', () => {
  const result = runJest('reset_modules');
  expect(result.status).toBe(0);
});
