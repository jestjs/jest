/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nullReturningFunc from '../only-file-to-transform.js';

it('strips flowtypes using babel-jest', () => {
  expect(nullReturningFunc()).toBe(null);
});
