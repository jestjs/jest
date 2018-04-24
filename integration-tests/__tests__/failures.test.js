/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const path = require('path');
const SkipOnWindows = require('../../scripts/SkipOnWindows');
const {extractSummary} = require('../Utils');
const runJest = require('../runJest');

const dir = path.resolve(__dirname, '../failures');

const normalizeDots = text => text.replace(/\.{1,}$/gm, '.');

SkipOnWindows.suite();

const cleanupStackTrace = stderr => {
  const STACK_REGEXP = /^.*at.*(setup-jest-globals|extractExpectedAssertionsErrors).*\n/gm;
  if (!STACK_REGEXP.test(stderr)) {
    throw new Error(
      `
      This function is used to remove inconsistent stack traces between
      jest-jasmine2 and jest-circus. If you see this error, that means the
      stack traces are no longer inconsistent and this function can be
      safely removed.

      output:
      ${stderr}
    `,
    );
  }

  return (
    stderr
      .replace(STACK_REGEXP, '')
      // Also remove trailing whitespace.
      .replace(/\s+$/gm, '')
  );
};

test('not throwing Error objects', () => {
  let stderr;
  stderr = runJest(dir, ['throw_number.test.js']).stderr;
  expect(extractSummary(stderr).rest).toMatchSnapshot();
  stderr = runJest(dir, ['throw_string.test.js']).stderr;
  expect(extractSummary(stderr).rest).toMatchSnapshot();
  stderr = runJest(dir, ['throw_object.test.js']).stderr;
  expect(extractSummary(stderr).rest).toMatchSnapshot();
  stderr = runJest(dir, ['assertion_count.test.js']).stderr;
  expect(extractSummary(cleanupStackTrace(stderr)).rest).toMatchSnapshot();
});

test('works with node assert', () => {
  const nodeMajorVersion = Number(process.versions.node.split('.')[0]);
  const {stderr} = runJest(dir, ['node_assertion_error.test.js']);
  let summary = normalizeDots(extractSummary(stderr).rest);

  // Node 9 started to include the error for `doesNotThrow`
  // https://github.com/nodejs/node/pull/12167
  if (nodeMajorVersion >= 9) {
    expect(summary).toContain(`
    assert.doesNotThrow(function)
    
    Expected the function not to throw an error.
    Instead, it threw:
      [Error: err!]
    
    Message:
      Got unwanted exception.
`);

    expect(summary).toContain(`
      69 | 
      70 | test('assert.doesNotThrow', () => {
    > 71 |   assert.doesNotThrow(() => {
      72 |     throw Error('err!');
      73 |   });
      74 | });
      
      at __tests__/node_assertion_error.test.js:71:10
`);

    const commonErrorMessage = `Message:
      Got unwanted exception.
`;

    if (nodeMajorVersion === 9) {
      const specificErrorMessage = `Message:
      Got unwanted exception.
    err!
`;

      expect(summary).toContain(specificErrorMessage);
      summary = summary.replace(specificErrorMessage, commonErrorMessage);
    } else {
      const specificErrorMessage = `Message:
      Got unwanted exception.
    Actual message: "err!"
`;

      expect(summary).toContain(specificErrorMessage);
      summary = summary.replace(specificErrorMessage, commonErrorMessage);
    }
  }

  if (nodeMajorVersion >= 10) {
    const ifErrorMessage = `
    assert.ifError(received, expected)
    
    Expected value ifError to:
      null
    Received:
      1
    
    Message:
      ifError got unwanted exception: 1
    
    Difference:
    
      Comparing two different types of values. Expected null but received number.

      65 | 
      66 | test('assert.ifError', () => {
    > 67 |   assert.ifError(1);
      68 | });
      69 | 
      70 | test('assert.doesNotThrow', () => {
      
      at __tests__/node_assertion_error.test.js:67:10
`;

    expect(summary).toContain(ifErrorMessage);
    summary = summary.replace(ifErrorMessage, '');
  } else {
    const ifErrorMessage = `
    Error
      1 thrown
`;

    expect(summary).toContain(ifErrorMessage);
    summary = summary.replace(ifErrorMessage, '');
  }

  expect(summary).toMatchSnapshot();
});

test('works with assertions in separate files', () => {
  const {stderr} = runJest(dir, ['test_macro.test.js']);

  expect(normalizeDots(extractSummary(stderr).rest)).toMatchSnapshot();
});

test('works with async failures', () => {
  const {stderr} = runJest(dir, ['async_failures.test.js']);

  expect(normalizeDots(extractSummary(stderr).rest)).toMatchSnapshot();
});

test('works with snapshot failures', () => {
  const {stderr} = runJest(dir, ['snapshot.test.js']);

  const result = normalizeDots(extractSummary(stderr).rest);

  expect(
    result.substring(0, result.indexOf('Snapshot Summary')),
  ).toMatchSnapshot();
});
