/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {onNodeVersions} from '@jest/test-utils';
import runJest, {runContinuous} from '../runJest';

try {
  require('async_hooks');
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    // eslint-disable-next-line jest/no-focused-tests
    fit('skip test for unsupported nodes', () => {
      console.warn('Skipping test for node ' + process.version);
    });
  } else {
    throw e;
  }
}

function getTextAfterTest(stderr: string) {
  return (stderr.split(/Ran all test suites(.*)\n/)[2] || '').trim();
}

it('prints message about flag on slow tests', async () => {
  const run = runContinuous('detect-open-handles', ['outside']);
  await run.waitUntil(({stderr}) =>
    stderr.includes(
      'Jest did not exit one second after the test run has completed.',
    ),
  );
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(wrap(textAfterTest)).toMatchSnapshot();
});

it('prints message about flag on forceExit', async () => {
  const run = runContinuous('detect-open-handles', ['outside', '--forceExit']);
  await run.waitUntil(({stderr}) => stderr.includes('Force exiting Jest'));
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(wrap(textAfterTest)).toMatchSnapshot();
});

it('prints out info about open handlers', async () => {
  const run = runContinuous('detect-open-handles', [
    'outside',
    '--detectOpenHandles',
  ]);
  await run.waitUntil(({stderr}) => stderr.includes('Jest has detected'));
  const {stderr} = await run.end();
  const textAfterTest = getTextAfterTest(stderr);

  expect(wrap(textAfterTest)).toMatchSnapshot();
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

onNodeVersions('>=11', () => {
  it('does not report timeouts using unref', () => {
    // The test here is basically that it exits cleanly without reporting anything (does not need `until`)
    const {stderr} = runJest('detect-open-handles', [
      'unref',
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

  expect(wrap(textAfterTest)).toMatchSnapshot();
});
