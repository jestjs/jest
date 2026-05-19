/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

export default async function isWatchmanInstalled(): Promise<boolean> {
  try {
    await promisify(execFile)('watchman', ['--version']);
    return true;
  } catch {
    return false;
  }
}
