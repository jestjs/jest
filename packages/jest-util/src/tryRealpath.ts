/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {realpathSync} from 'graceful-fs';
import type {Config} from '@jest/types';

export default function tryRealpath(path: Config.Path): Config.Path {
  try {
    path = realpathSync.native(path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return path;
}
