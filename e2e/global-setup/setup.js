/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createDirectory} = require('jest-util');

const DIR = path.join(os.tmpdir(), 'jest-global-setup');

module.exports = function () {
  // This uses a flow annotation to show it can be transpiled
  return new Promise((resolve, reject: any) => {
    createDirectory(DIR);
    const fileId = crypto.randomBytes(20).toString('hex');
    fs.writeFileSync(path.join(DIR, fileId), 'setup');
    resolve();
  });
};
