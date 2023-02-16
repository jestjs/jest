/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';

export default function createDirectory(path: string): void {
  try {
    fs.mkdirSync(path, {recursive: true});
  } catch (e: any) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}
