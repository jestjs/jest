/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';

test('makeTestResults does not thrown a stack overflow exception', () => {
  let testString = 'describe("top level describe", () => {';
  const numberOfTestBlocks = 150_000;
  let currentTestIndex = 0;

  while (currentTestIndex < numberOfTestBlocks) {
    testString += `test("should do something #${currentTestIndex++}", () => {});`;
  }

  testString += '})';

  const {stdout} = runTest(testString);

  expect(stdout.split('\n')).toHaveLength(900_010);
});
