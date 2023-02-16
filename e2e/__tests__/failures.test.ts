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

const normalizeDots = (text: string) => text.replace(/\.{1,}$/gm, '.');

function cleanStderr(stderr: string) {
  const {rest} = extractSummary(stderr);
  return rest
    .replace(/.*(jest-jasmine2|jest-circus).*\n/g, '')
    .replace(new RegExp('Failed: Object {', 'g'), 'thrown: Object {');
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
    .filter(line => line.indexOf('packages/expect/build/index.js') === -1)
    .join('\n');

  // Remove replacements when jasmine is gone
  const result = normalizeDots(rest)
    .replace(/.*thrown:.*\n/, '')
    .replace(/.*Use jest\.setTimeout\(newTimeout\).*/, '<REPLACED>')
    .replace(/.*Timeout - Async callback was not.*/, '<REPLACED>');

  expect(result).toMatchSnapshot();
});

test('works with snapshot failures', () => {
  const {stderr} = runJest(dir, ['snapshot.test.js']);

  const result = normalizeDots(cleanStderr(stderr));

  expect(
    result.substring(0, result.indexOf('Snapshot Summary')),
  ).toMatchSnapshot();
});

test('works with snapshot failures with hint', () => {
  const {stderr} = runJest(dir, ['snapshotWithHint.test.js']);

  const result = normalizeDots(cleanStderr(stderr));

  expect(
    result.substring(0, result.indexOf('Snapshot Summary')),
  ).toMatchSnapshot();
});

test('errors after test has completed', () => {
  const {stderr} = runJest(dir, ['errorAfterTestComplete.test.js']);

  expect(stderr).toMatch(
    /Error(WithStack)?: Caught error after test environment was torn down/,
  );
  expect(stderr).toMatch(/Failed: "fail async"/);
});
