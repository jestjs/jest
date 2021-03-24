/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import fs from 'graceful-fs';
import {createDirectory} from 'jest-util';

const DIR = path.join(os.tmpdir(), 'jest-esm-global-teardown');

export default function () {
  return new Promise((resolve, reject) => {
    createDirectory(DIR);
    const fileId = crypto.randomBytes(20).toString('hex');
    fs.writeFileSync(path.join(DIR, fileId), 'teardown');
    resolve();
  });
}
