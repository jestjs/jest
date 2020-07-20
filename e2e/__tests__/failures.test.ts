/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import {extractSummary, runYarn} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../failures');

const normalizeDots = (text: string) => text.replace(/\.{1,}$/gm, '.');

function cleanStderr(stderr: string) {
  const {rest} = extractSummary(stderr);
  return rest
    .replace(/.*(jest-jasmine2|jest-circus).*\n/g, '')
    .replace(new RegExp('Failed: Object {', 'g'), 'thrown: Object {');
}

const nodeMajorVersion = Number(process.versions.node.split('.')[0]);

beforeAll(() => {
  runYarn(dir);
});

test('not throwing Error objects', () => {
  let stderr;
  stderr = runJest(dir, ['throwNumber.test.js']).stderr;
  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
  stderr = runJest(dir, ['throwString.test.js']).stderr;
  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
  stderr = runJest(dir, ['throwObject.test.js']).stderr;
  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
  stderr = runJest(dir, ['assertionCount.test.js']).stderr;
  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
  stderr = runJest(dir, ['duringTests.test.js']).stderr;

  if (nodeMajorVersion < 10) {
    const lineEntry = '(__tests__/duringTests.test.js:38:8)';

    expect(stderr).toContain(`at Object.<anonymous>.done ${lineEntry}`);

    stderr = stderr.replace(
      `at Object.<anonymous>.done ${lineEntry}`,
      `at Object.<anonymous> ${lineEntry}`,
    );
  } else if (nodeMajorVersion < 12) {
    const lineEntry = '(__tests__/duringTests.test.js:38:8)';

    expect(stderr).toContain(`at Object.done ${lineEntry}`);

    stderr = stderr.replace(
      `at Object.done ${lineEntry}`,
      `at Object.<anonymous> ${lineEntry}`,
    );
  }

  expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
});

test('works with node assert', () => {
  const {stderr} = runJest(dir, ['assertionError.test.js']);
  let summary = normalizeDots(cleanStderr(stderr));

  // Node 9 started to include the error for `doesNotThrow`
  // https://github.com/nodejs/node/pull/12167
  if (nodeMajorVersion >= 10) {
    expect(summary).toContain(`
    assert.doesNotThrow(function)

    Expected the function not to throw an error.
    Instead, it threw:
      [Error: err!]

    Message:
      Got unwanted exception.
`);

    expect(summary).toContain(`
      68 | 
      69 | test('assert.doesNotThrow', () => {
    > 70 |   assert.doesNotThrow(() => {
         |          ^
      71 |     throw Error('err!');
      72 |   });
      73 | });

      at Object.doesNotThrow (__tests__/assertionError.test.js:70:10)
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

      64 | 
      65 | test('assert.ifError', () => {
    > 66 |   assert.ifError(1);
         |          ^
      67 | });
      68 | 
      69 | test('assert.doesNotThrow', () => {

      at Object.ifError (__tests__/assertionError.test.js:66:10)
`;

    expect(summary).toContain(ifErrorMessage);
    summary = summary.replace(ifErrorMessage, '');
  } else {
    const ifErrorMessage = `
    thrown: 1

      63 | });
      64 | 
    > 65 | test('assert.ifError', () => {
         | ^
      66 |   assert.ifError(1);
      67 | });
      68 | 

      at Object.test (__tests__/assertionError.test.js:65:1)
`;

    expect(summary).toContain(ifErrorMessage);
    summary = summary.replace(ifErrorMessage, '');
  }

  expect(wrap(summary)).toMatchSnapshot();
});

test('works with assertions in separate files', () => {
  const {stderr} = runJest(dir, ['testMacro.test.js']);

  expect(wrap(normalizeDots(cleanStderr(stderr)))).toMatchSnapshot();
});

test('works with async failures', () => {
  const {stderr} = runJest(dir, ['asyncFailures.test.js']);

  const rest = cleanStderr(stderr)
    .split('\n')
    .filter(line => line.indexOf('packages/expect/build/index.js') === -1)
    .join('\n');

  // Remove replacements when jasmine is gone
  const result = normalizeDots(rest)
    .replace(/.*thrown:.*\n/, '')
    .replace(/.*Use jest\.setTimeout\(newTimeout\).*/, '<REPLACED>')
    .replace(/.*Timeout - Async callback was not.*/, '<REPLACED>');

  expect(wrap(result)).toMatchSnapshot();
});

test('works with snapshot failures', () => {
  const {stderr} = runJest(dir, ['snapshot.test.js']);

  const result = normalizeDots(cleanStderr(stderr));

  expect(
    wrap(result.substring(0, result.indexOf('Snapshot Summary'))),
  ).toMatchSnapshot();
});

test('works with snapshot failures with hint', () => {
  const {stderr} = runJest(dir, ['snapshotWithHint.test.js']);

  const result = normalizeDots(cleanStderr(stderr));

  expect(
    wrap(result.substring(0, result.indexOf('Snapshot Summary'))),
  ).toMatchSnapshot();
});

test('errors after test has completed', () => {
  const {stderr} = runJest(dir, ['errorAfterTestComplete.test.js']);

  expect(stderr).toMatch(
    /Error: Caught error after test environment was torn down/,
  );
  expect(stderr).toMatch(/Failed: "fail async"/);
});
