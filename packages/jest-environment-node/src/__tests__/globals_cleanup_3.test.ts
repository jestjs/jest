/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function onlyIfGlobalsCleanup(
  globalsCleanup: string,
  testBody: () => void,
): void {
  const describeFunc =
    process.env.GLOBALS_CLEANUP === globalsCleanup ? describe : describe.skip;
  describeFunc(`GLOBALS_CLEANUP=${globalsCleanup}`, testBody);
}

describe('Globals Cleanup 3', () => {
  onlyIfGlobalsCleanup('off', () => {
    test('assign Object prototype descriptors to a new empty object', () => {
      const descriptors = Object.getOwnPropertyDescriptors(
        Object.getPrototypeOf({}),
      );
      Object.assign({}, descriptors);
    });
  });
});
