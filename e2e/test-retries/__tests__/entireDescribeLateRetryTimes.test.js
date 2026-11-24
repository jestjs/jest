/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

test('rejects retry options set after tests start', () => {
  jest.retryTimes(1, {entireDescribe: true});
});
