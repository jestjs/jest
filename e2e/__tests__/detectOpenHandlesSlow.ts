/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {runContinuous} from '../runJest';

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
