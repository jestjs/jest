/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {onNodeVersions} from '@jest/test-utils';
import runJest, {runContinuous} from '../runJest';

function getTextAfterTest(stderr: string) {
  return (stderr.split(/Ran all test suites(.*)\n/)[2] || '').trim();
}

beforeAll(() => {
  jest.retryTimes(3);
});

it('prints message about flag on slow tests', async () => {
  const run = runContinuous('detect-open-handles', ['outside']);
  await run.waitUntil(({stderr}) =>
    stderr.includes(
      'Jest did not exit one second after the test run has completed.',
    ),
  );
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints message about flag on slow tests with a custom timeout', async () => {
  const run = runContinuous('detect-open-handles', [
    'outside',
    '--openHandlesTimeout=500',
  ]);
  await run.waitUntil(({stderr}) =>
    stderr.includes('Jest did not exit 0.5 seconds'),
  );
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints message about flag on forceExit', async () => {
  const run = runContinuous('detect-open-handles', ['outside', '--forceExit']);
  await run.waitUntil(({stderr}) => stderr.includes('Force exiting Jest'));
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints out info about open handlers', async () => {
  const run = runContinuous('detect-open-handles', [
    'outside',
    '--detectOpenHandles',
  ]);
  await run.waitUntil(({stderr}) => stderr.includes('Jest has detected'));
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('does not report promises', () => {
  // The test here is basically that it exits cleanly without reporting anything (does not need `until`)
  const {stderr} = runJest('detect-open-handles', [
    'promise',
    '--detectOpenHandles',
  ]);
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toBe('');
});

it('does not report crypto random data', () => {
  // The test here is basically that it exits cleanly without reporting anything (does not need `until`)
  const {stderr} = runJest('detect-open-handles', [
    'crypto',
    '--detectOpenHandles',
  ]);
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toBe('');
});

it('does not report ELD histograms', () => {
  const {stderr} = runJest('detect-open-handles', [
    'histogram',
    '--detectOpenHandles',
  ]);
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toBe('');
});

describe('notify', () => {
  it('does not report --notify flag', () => {
    if (process.platform === 'win32') {
      console.warn('[SKIP] Does not work on Windows');

      return;
    }

    // The test here is basically that it exits cleanly without reporting anything (does not need `until`)
    const {stderr} = runJest('detect-open-handles', ['notify', '--notify']);
    const textAfterTest = getTextAfterTest(stderr);

    expect(textAfterTest).toBe('');
  });
});

it('does not report timeouts using unref', () => {
  // The test here is basically that it exits cleanly without reporting anything (does not need `until`)
  const {stderr} = runJest('detect-open-handles', [
    'unref',
    '--detectOpenHandles',
  ]);
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toBe('');
});

it('does not report child_process using unref', () => {
  // The test here is basically that it exits cleanly without reporting anything (does not need `until`)
  const {stderr} = runJest('detect-open-handles', [
    'child_process',
    '--detectOpenHandles',
  ]);
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toBe('');
});

onNodeVersions('>=18.1.0', () => {
  it('does not report worker using unref', () => {
    // The test here is basically that it exits cleanly without reporting anything (does not need `until`)
    const {stderr} = runJest('detect-open-handles', [
      'worker',
      '--detectOpenHandles',
    ]);
    const textAfterTest = getTextAfterTest(stderr);

    expect(textAfterTest).toBe('');
  });
});

it('prints out info about open handlers from inside tests', async () => {
  const run = runContinuous('detect-open-handles', [
    'inside',
    '--detectOpenHandles',
  ]);
  await run.waitUntil(({stderr}) => stderr.includes('Jest has detected'));
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints out info about open handlers from tests with a `done` callback', async () => {
  const run = runContinuous('detect-open-handles', [
    'in-done-function',
    '--detectOpenHandles',
  ]);
  await run.waitUntil(({stderr}) => stderr.includes('Jest has detected'));
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints out info about open handlers from lifecycle functions with a `done` callback', async () => {
  const run = runContinuous('detect-open-handles', [
    'in-done-lifecycle',
    '--detectOpenHandles',
  ]);
  await run.waitUntil(({stderr}) => stderr.includes('Jest has detected'));
  const {stderr} = await run.end();
  let textAfterTest = getTextAfterTest(stderr);

  // Circus and Jasmine have different contexts, leading to slightly different
  // names for call stack functions. The difference shouldn't be problematic
  // for users, so this normalizes them so the test works in both environments.
  textAfterTest = textAfterTest.replace(
    'at Object.setTimeout',
    'at setTimeout',
  );

  expect(textAfterTest).toMatchSnapshot();
});

it('does not print info about open handlers for a server that is already closed', async () => {
  const run = runContinuous('detect-open-handles', [
    'recently-closed',
    '--detectOpenHandles',
  ]);
  await run.waitUntil(({stderr}) => stderr.includes('Ran all test suites'));
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});
