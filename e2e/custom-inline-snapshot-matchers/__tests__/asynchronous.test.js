/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {toMatchInlineSnapshot} = require('jest-snapshot');

expect.extend({
  async toMatchObservationInlineSnapshot(fn, ...args) {
    this.error = new Error();
    const result = await fn();

    return toMatchInlineSnapshot.call(this, result, ...args);
  },
});

test('new async, inline snapshots', async () => {
  await expect(async () => 'result #1').toMatchObservationInlineSnapshot();
  await expect(async () => 'result #2').toMatchObservationInlineSnapshot();
});

test('mismatching async, inline snapshots', async () => {
  await expect(async () => 'result #1').toMatchObservationInlineSnapshot(
    `"result #?"`,
  );
  await expect(async () => 'result #1').toMatchObservationInlineSnapshot(
    `"result #?"`,
  );
});
