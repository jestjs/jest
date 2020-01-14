/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {sync as mkdirp} from 'mkdirp';
import {Path} from '@jest/config-utils';

export default function createDirectory(path: Path) {
  try {
    mkdirp(path, '777');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}
