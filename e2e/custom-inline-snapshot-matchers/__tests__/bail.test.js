/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {toMatchInlineSnapshot} = require('jest-snapshot');

expect.extend({
  toMatchStateInlineSnapshot(...args) {
    this.dontThrow = () => {};
    return toMatchInlineSnapshot.call(this, ...args);
  },
});

let state = 'initial';
function transition() {
  // Typo in the implementation should cause the test to fail
  if (state === 'INITIAL') {
    state = 'pending';
  } else if (state === 'pending') {
    state = 'done';
  }
}

it('transitions as expected', () => {
  expect(state).toMatchStateInlineSnapshot(`"initial"`);
  transition();
  // Already produces a mismatch. No point in continuing the test.
  expect(state).toMatchStateInlineSnapshot(`"loading"`);
  transition();
  expect(state).toMatchStateInlineSnapshot(`"done"`);
});
