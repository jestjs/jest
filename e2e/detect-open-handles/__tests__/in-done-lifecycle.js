/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const http = require('http');

beforeAll(done => {
  const server = http.createServer((_, response) => response.end('ok'));
  server.listen(0, () => {
    done();
  });
});

test('something', () => {
  expect(true).toBe(true);
});
