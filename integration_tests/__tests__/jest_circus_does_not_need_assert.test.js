/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */
'use strict';

// TODO: Should I be using runJest for this?
// TODO: Is there a way to force this test to run using jest-circus?
describe('jest circus can run when assert is unavailable', () => {
  // TODO: This mock is probably installed too late.
  jest.mock('assert', () => {
    throw new Error("Cannot find module 'assert'");
  });

  it('still works', () => {
    expect(2 + 2).toBe(4);
  });
});
