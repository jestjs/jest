/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';

export default function createDirectory(path: Config.Path): void {
  try {
    fs.mkdirSync(path, {recursive: true});
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}
