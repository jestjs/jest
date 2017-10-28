/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */

'use strict';

test('requestAnimationFrame test', done => {
  expect.hasAssertions();

  requestAnimationFrame(timestamp => {
    expect(true).toBe(true);
    expect(timestamp).toBeGreaterThan(0);

    done();
  });
});

test('cancelAnimationFrame test', done => {
  expect.hasAssertions();

  // Will be immediately cancelled. Must never run.
  cancelAnimationFrame(requestAnimationFrame(() => {
    expect(true).toBe(false);
    done();
  }));

  // Make sure it has not fired.
  const REASONABLE_TIME = 100;
  setTimeout(() => {
    expect(true).toBe(true);
    done();
  }, REASONABLE_TIME);
});
