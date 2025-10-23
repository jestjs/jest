/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';

// rootDir and filename must be absolute paths (resolved)
export function relative(rootDir: string, filename: string): string {
  return filename.startsWith(rootDir + path.sep)
    ? filename.slice(rootDir.length + 1)
    : path.relative(rootDir, filename);
}

const INDIRECTION_FRAGMENT = `..${path.sep}`;

// rootDir must be an absolute path and relativeFilename must be simple
// (e.g.: foo/bar or ../foo/bar, but never ./foo or foo/../bar)
export function resolve(rootDir: string, relativeFilename: string): string {
  return relativeFilename.startsWith(INDIRECTION_FRAGMENT)
    ? path.resolve(rootDir, relativeFilename)
    : rootDir + path.sep + relativeFilename;
}
