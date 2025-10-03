/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {createDirectory} = require('jest-util');

const DIR = path.join(
  os.tmpdir(),
  'jest-global-setup-per-worker-custom-transform',
);

module.exports = function () {
  return new Promise(resolve => {
    createDirectory(DIR);
    const fileId = crypto.randomBytes(20).toString('hex');
    const data = ['setup-per-worker', process.env.JEST_WORKER_ID].join('\n');
    fs.writeFileSync(path.join(DIR, fileId), data);
    resolve();
  });
};
