/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const http = require('http');

it('should not timeout', async () => {
  const server = http.createServer();
  await new Promise(resolve => {
    server.listen(resolve);
  });
  await new Promise((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});
