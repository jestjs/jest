/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {json as runWithJson} from '../runJest';

type TestResult = {
  startTime: number;
  endTime: number;
  name: string;
};

const testsOverlap = (testA: TestResult, testB: TestResult): boolean => {
  if (testA.startTime <= testB.startTime && testB.startTime < testA.endTime)
    return true; // b starts in a
  if (testA.startTime < testB.endTime && testB.endTime <= testA.endTime)
    return true; // b ends in a
  if (testB.startTime <= testA.startTime && testA.endTime <= testB.endTime)
    return true; // a in b
  return false;
};

const expectTestsOverlap = (tests: Array<TestResult>) => {
  tests.forEach(testA =>
    tests.forEach(testB => {
      if (!testsOverlap(testA, testB)) {
        throw new Error(
          `${testA.name} and\n${testB.name}\ndid not run at the same time`,
        );
      }
    }),
  );
};

const expectTestsDontOverlap = (tests: Array<TestResult>) => {
  tests.forEach(testA =>
    tests.forEach(testB => {
      if (testA.name !== testB.name && testsOverlap(testA, testB)) {
        throw new Error(
          `${testA.name} and\n${testB.name}\nran at the same time`,
        );
      }
    }),
  );
};

test('selectiveRunInBand', () => {
  const result = runWithJson('selective-run-in-band', ['--verbose']);
  const testResults = result.json.testResults;

  const parallelTests = testResults.filter(({name}) =>
    name.includes('run-parallel-project'),
  );
  const inBandTests1 = testResults.filter(({name}) =>
    name.includes('run-in-band-project-1'),
  );
  const inBandTests2 = testResults.filter(({name}) =>
    name.includes('run-in-band-project-2'),
  );

  expect(result.exitCode).toBe(0);

  // Be sure that all the tests should overlap if parallel enabled at project level
  expect(
    testResults.every(test => test.endTime - test.startTime >= 500),
  ).toBeTruthy();

  // all the firsts tests would be expected to run at the same time
  expectTestsOverlap([parallelTests[0], inBandTests1[0], inBandTests2[0]]);
  expectTestsOverlap(parallelTests);
  expectTestsDontOverlap(inBandTests1);
  expectTestsDontOverlap(inBandTests2);
});
