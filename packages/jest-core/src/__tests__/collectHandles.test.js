/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {PerformanceObserver} from 'perf_hooks';
import collectHandles from '../collectHandles';

describe('collectHandles', () => {
  it('should collect Timeout', () => {
    const handleCollector = collectHandles();

    const interval = setInterval(() => {}, 100);

    const openHandles = handleCollector();

    expect(openHandles).toHaveLength(1);
    expect(openHandles[0].message).toContain('Timeout');

    clearInterval(interval);
  });

  it('should not collect the PerformanceObserver open handle', () => {
    const handleCollector = collectHandles();
    const obs = new PerformanceObserver((list, observer) => {});
    obs.observe({entryTypes: ['mark']});

    const openHandles = handleCollector();

    expect(openHandles).toHaveLength(0);
    obs.disconnect();
  });
});
