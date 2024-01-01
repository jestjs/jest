/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary, runYarnInstall} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../failures');

const normalizeDots = (text: string) => text.replaceAll(/\.+$/gm, '.');

function cleanStderr(stderr: string) {
  const {rest} = extractSummary(stderr);
  return rest
    .replaceAll(/.*(jest-jasmine2|jest-circus).*\n/g, '')
    .replaceAll(new RegExp('Failed: Object {', 'g'), 'thrown: Object {');
}

beforeAll(() => {
  runYarnInstall(dir);
});

test('not throwing Error objects', () => {
  let stderr;
  stderr = runJest(dir, ['throwNumber.test.js']).stderr;
  expect(cleanStderr(stderr)).toMatchSnapshot();
  stderr = runJest(dir, ['throwString.test.js']).stderr;
  expect(cleanStderr(stderr)).toMatchSnapshot();
  stderr = runJest(dir, ['throwObject.test.js']).stderr;
  expect(cleanStderr(stderr)).toMatchSnapshot();
  stderr = runJest(dir, ['assertionCount.test.js']).stderr;
  expect(cleanStderr(stderr)).toMatchSnapshot();
  stderr = runJest(dir, ['duringTests.test.js']).stderr;
  expect(cleanStderr(stderr)).toMatchSnapshot();
  stderr = runJest(dir, ['throwObjectWithStackProp.test.js']).stderr;
  expect(cleanStderr(stderr)).toMatchSnapshot();
});

test('works with node assert', () => {
  const {stderr} = runJest(dir, ['assertionError.test.js']);
  const summary = normalizeDots(cleanStderr(stderr));

  expect(summary).toMatchSnapshot();
});

test('works with assertions in separate files', () => {
  const {stderr} = runJest(dir, ['testMacro.test.js']);

  expect(normalizeDots(cleanStderr(stderr))).toMatchSnapshot();
});

test('works with async failures', () => {
  const {stderr} = runJest(dir, ['asyncFailures.test.js']);

  const rest = cleanStderr(stderr)
    .split('\n')
    .filter(line => !line.includes('packages/expect/build/index.js'))
    .join('\n');

  // Remove replacements when jasmine is gone
  const result = normalizeDots(rest)
    .replace(/.*thrown:.*\n/, '')
    .replace(
      /.*Add a timeout value to this test to increase the timeout, if this is a long-running test. See https:\/\/jestjs.io\/docs\/api#testname-fn-timeout.+/,
      '<REPLACED>',
    )
    .replace(/.*Timeout - Async callback was not.*/, '<REPLACED>');

  expect(result).toMatchSnapshot();
});

test('works with snapshot failures', () => {
  const {stderr} = runJest(dir, ['snapshot.test.js']);

  const result = normalizeDots(cleanStderr(stderr));

  expect(result.slice(0, result.indexOf('Snapshot Summary'))).toMatchSnapshot();
});

test('works with snapshot failures with hint', () => {
  const {stderr} = runJest(dir, ['snapshotWithHint.test.js']);

  const result = normalizeDots(cleanStderr(stderr));

  expect(result.slice(0, result.indexOf('Snapshot Summary'))).toMatchSnapshot();
});

test('works with error with cause', () => {
  const {stderr} = runJest(dir, ['errorWithCause.test.js']);
  const summary = normalizeDots(cleanStderr(stderr));

  expect(summary).toMatchSnapshot();
});

test('works with error with cause thrown outside tests', () => {
  const {stderr} = runJest(dir, ['errorWithCauseInDescribe.test.js']);
  const summary = normalizeDots(cleanStderr(stderr));

  const sanitizedSummary = summary
    .replaceAll(' Suite.f ', ' f ') // added by jasmine runner
    .split('\n')
    .map(line => line.trim()) // jasmine runner does not come with the same indentation
    .join('\n');

  expect(
    // jasmine runner differ from circus one in this case, we just start
    // the comparison when the stack starts to be reported
    sanitizedSummary.slice(sanitizedSummary.indexOf('error during f')),
  ).toMatchSnapshot();
});

test('errors after test has completed', () => {
  const {stderr} = runJest(dir, ['errorAfterTestComplete.test.js']);

  expect(stderr).toMatch(
    /Error(WithStack)?: Caught error after test environment was torn down/,
  );
  expect(stderr).toMatch(/Failed: "fail async"/);
});
