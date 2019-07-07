/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';
import {extractSummary} from '../Utils';

const dir = path.resolve(__dirname, '../before-each-aborts-tests');

const runAgainstSnapshot = testPath => {
  const {status, stderr} = runJest(dir, [testPath]);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(1);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
};

describe('in the global context', () => {
  test('does not run any tests if a global beforeEach hook fails', () => {
    runAgainstSnapshot('global/skipsTests.test.js');
  });

  test('still runs global afterEach hooks if a global beforeEach fails', () => {
    runAgainstSnapshot('global/afterEachHook.test.js');
  });

  test('still runs global afterAll hooks if a global beforeEach fails', () => {
    runAgainstSnapshot('global/afterAllHook.test.js');
  });
});

describe('without nested blocks', () => {
  test('does not run the test if beforeEach fails', () => {
    runAgainstSnapshot('singleBlock/singleTest.test.js');
  });

  test('does not run any of the tests if beforeEach fails', () => {
    runAgainstSnapshot('singleBlock/multipleTests.test.js');
  });

  test('runs all of the beforeEach hooks if one fails but does not run the tests', () => {
    runAgainstSnapshot('singleBlock/multipleBeforeEachHooks.test.js');
  });

  test('still runs afterEach hook if the beforeEach hook fails', () => {
    runAgainstSnapshot('singleBlock/afterEachHook.test.js');
  });

  test('still runs the afterAll hook if the beforeEach hook fails', () => {
    runAgainstSnapshot('singleBlock/afterAllHook.test.js');
  });
});

describe('inside deeply nested blocks', () => {
  test('can cancel tests only for the nested describe block it is in', () => {
    runAgainstSnapshot('nestedBlocks/testsInDifferentBlocks.test.js');
  });

  test('still runs the afterAll hooks if a nested beforeEach fails', () => {
    runAgainstSnapshot('nestedBlocks/afterAllHook.test.js');
  });

  test('still runs afterEach hooks for the test whose beforeEach failed', () => {
    runAgainstSnapshot('nestedBlocks/afterEachHook.test.js');
  });
});
