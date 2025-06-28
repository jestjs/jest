/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import example from './node_modules/example';
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {createDirectory} = require('jest-util');

const DIR = path.join(os.tmpdir(), 'jest-global-setup-per-worker-node-modules');

module.exports = function () {
  return new Promise(resolve => {
    createDirectory(DIR);
    const fileId = crypto.randomBytes(20).toString('hex');
    fs.writeFileSync(path.join(DIR, fileId), `hello ${example()}`);
    resolve();
  });
};
