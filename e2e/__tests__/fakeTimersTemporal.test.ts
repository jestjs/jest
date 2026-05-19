/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {onNodeVersions} from '@jest/test-utils';
import runJest from '../runJest';

onNodeVersions('>=26', () => {
  test('useFakeTimers({now}) and setSystemTime accept Temporal instances', () => {
    const result = runJest('fake-timers-temporal');
    expect(result.exitCode).toBe(0);
  });
});
