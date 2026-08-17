/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';

const platform = os.platform();

/**
 * A file can vanish between the moment it is observed and the moment it is
 * read, which is `ENOENT`. On Windows an outside process holding the file open
 * -- `git maintenance` touching `.git/index.lock` or `.git/objects`, for
 * instance -- surfaces as `EPERM` instead. Neither means anything is wrong with
 * the watcher or the crawl, so neither should abort it.
 */
export function isIgnorableFileError(error: NodeJS.ErrnoException): boolean {
  return (
    error.code === 'ENOENT' || (error.code === 'EPERM' && platform === 'win32')
  );
}
