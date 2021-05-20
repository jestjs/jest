/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import http from 'http';
import {PerformanceObserver} from 'perf_hooks';
import collectHandles from '../collectHandles';

describe('collectHandles', () => {
  it('should collect Timeout', async () => {
    const handleCollector = collectHandles();

    const interval = setInterval(() => {}, 100);

    const openHandles = await handleCollector();

    expect(openHandles).toHaveLength(1);
    expect(openHandles[0].message).toContain('Timeout');

    clearInterval(interval);
  });

  it('should not collect the PerformanceObserver open handle', async () => {
    const handleCollector = collectHandles();
    const obs = new PerformanceObserver((list, observer) => {});
    obs.observe({entryTypes: ['mark']});

    const openHandles = await handleCollector();

    expect(openHandles).toHaveLength(0);
    obs.disconnect();
  });

  it('should collect handles opened in test functions with `done` callbacks', done => {
    const handleCollector = collectHandles();
    const server = http.createServer((_, response) => response.end('ok'));
    server.listen(0, () => {
      // Collect results while server is still open.
      handleCollector()
        .then(openHandles => {
          server.close(() => {
            expect(openHandles).toContainEqual(
              expect.objectContaining({message: 'TCPSERVERWRAP'}),
            );
            done();
          });
        })
        .catch(done);
    });
  });

  it('should not collect handles that have been queued to close', async () => {
    const handleCollector = collectHandles();
    const server = http.createServer((_, response) => response.end('ok'));

    // Start and stop server.
    await new Promise(r => server.listen(0, r));
    await new Promise(r => server.close(r));

    const openHandles = await handleCollector();
    expect(openHandles).toHaveLength(0);
  });
});
