/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

// Temporal needs ICU4X at Node's configure time, so a Node version that should
// have it can still ship without the global.
const hasTemporal = 'Temporal' in globalThis;

(hasTemporal ? test : test.skip)(
  'useFakeTimers({now}) and setSystemTime accept Temporal instances',
  () => {
    const result = runJest('fake-timers-temporal');
    expect(result.exitCode).toBe(0);
  },
);
