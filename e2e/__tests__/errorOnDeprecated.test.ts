/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {skipSuiteOnJestCircus} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

skipSuiteOnJestCircus();

const testFiles = [
  'fail.test.js',
  'jasmine.addMatchers.test.js',
  'jasmine.any.test.js',
  'jasmine.anything.test.js',
  'jasmine.arrayContaining.test.js',
  'jasmine.createSpy.test.js',
  'jasmine.objectContaining.test.js',
  'jasmine.stringMatching.test.js',
  'pending.test.js',
  'spyOn.test.js',
  'spyOnProperty.test.js',
  'defaultTimeoutInterval.test.js',
];

const SHOULD_NOT_PASS_IN_JEST = new Set([
  'fail.test.js',
  'spyOnProperty.test.js',
]);

const nodeMajorVersion = Number(process.versions.node.split('.')[0]);

testFiles.forEach(testFile => {
  test(`${testFile} errors in errorOnDeprecated mode`, () => {
    const result = runJest('error-on-deprecated', [
      testFile,
      '--errorOnDeprecated',
    ]);
    expect(result.exitCode).toBe(1);
    let {rest} = extractSummary(result.stderr);

    if (
      nodeMajorVersion < 12 &&
      testFile === 'defaultTimeoutInterval.test.js'
    ) {
      const lineEntry = '(__tests__/defaultTimeoutInterval.test.js:10:3)';

      expect(rest).toContain(`at Object.<anonymous>.test ${lineEntry}`);

      rest = rest.replace(
        `at Object.<anonymous>.test ${lineEntry}`,
        `at Object.<anonymous> ${lineEntry}`,
      );
    }

    expect(wrap(rest)).toMatchSnapshot();
  });
});

testFiles.forEach(testFile => {
  const shouldPass = SHOULD_NOT_PASS_IN_JEST.has(testFile);

  const expectation = `${testFile} ${shouldPass ? 'errors' : 'passes'}`;
  const testName = `${expectation} when not in errorOnDeprecated mode`;

  test(testName, () => {
    const result = runJest('error-on-deprecated', [testFile]);
    expect(result.exitCode).toBe(shouldPass ? 1 : 0);
  });
});
