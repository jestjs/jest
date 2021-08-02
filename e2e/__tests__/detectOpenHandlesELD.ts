/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {onNodeVersions} from '@jest/test-utils';
import runJest from '../runJest';

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

onNodeVersions('>=11.10.0', () => {
  it('does not report ELD histograms', () => {
    const {stderr} = runJest('detect-open-handles', [
      'histogram',
      '--detectOpenHandles',
    ]);
    const textAfterTest = getTextAfterTest(stderr);

    expect(textAfterTest).toBe('');
  });
});
