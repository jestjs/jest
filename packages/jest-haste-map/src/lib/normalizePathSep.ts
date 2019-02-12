/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

let normalizePathSep: (string: string) => string;
if (path.sep === '/') {
  normalizePathSep = (filePath: string) => filePath;
} else {
  normalizePathSep = (filePath: string) => filePath.replace(/\//g, path.sep);
}

export default normalizePathSep;
