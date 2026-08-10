/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createServer} from 'http';

test('a recently closed server should not be detected by --detectOpenHandles', done => {
  const server = createServer((_, response) => response.end('ok'));
  server.listen(0, () => {
    expect(true).toBe(true);

    // Close server and return immediately on callback. During the "close"
    // callback, async hooks usually have not yet been called, but we want to
    // make sure Jest can figure out that this server is closed.
    server.close(done);
  });
});
