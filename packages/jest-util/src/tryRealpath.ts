/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {realpathSync} from 'graceful-fs';

export default function tryRealpath(path: string): string {
  try {
    path = realpathSync.native(path);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return path;
}
