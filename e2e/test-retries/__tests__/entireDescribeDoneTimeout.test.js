/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let attempt = 0;
let firstAttemptDone;

jest.retryTimes(1, {entireDescribe: true});

beforeAll(done => {
  attempt += 1;
  if (attempt === 1) {
    firstAttemptDone = done;
    return;
  }

  firstAttemptDone();
  done();
}, 20);

test('does not share done state between hook attempts', () => {
  expect(attempt).toBe(2);
});
