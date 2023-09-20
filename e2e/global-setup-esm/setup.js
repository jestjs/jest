/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as crypto from 'crypto';
import * as os from 'os';
import * as path from 'path';
import fs from 'graceful-fs';
import jestUtil from 'jest-util';

const {createDirectory} = jestUtil;

const DIR = path.join(os.tmpdir(), 'jest-global-setup-esm');

export default function () {
  return new Promise(resolve => {
    createDirectory(DIR);
    const fileId = crypto.randomBytes(20).toString('hex');
    fs.writeFileSync(path.join(DIR, fileId), 'setup');
    resolve();
  });
}
