/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';
import picomatch from 'picomatch';

const platform = os.platform();

export const CHANGE_EVENT = 'change';
export const DELETE_EVENT = 'delete';
export const ADD_EVENT = 'add';
export const ALL_EVENT = 'all';

const matcherCache = new Map<string, picomatch.Matcher>();

function getMatcher(glob: string, dot: boolean): picomatch.Matcher {
  const key = `${dot}:${glob}`;
  let matcher = matcherCache.get(key);
  if (matcher == null) {
    matcher = picomatch(glob, {dot});
    matcherCache.set(key, matcher);
  }
  return matcher;
}

/**
 * A file can vanish between a watcher event and the `lstat` that follows it,
 * which is `ENOENT`. On Windows an outside process holding the file open --
 * `git maintenance` touching `.git/index.lock` or `.git/objects`, for instance
 * -- surfaces as `EPERM` instead (nodejs/node#4337). Neither means the watcher
 * is broken, so neither should tear it down.
 */
export function isIgnorableFileError(error: NodeJS.ErrnoException): boolean {
  return (
    error.code === 'ENOENT' || (error.code === 'EPERM' && platform === 'win32')
  );
}

export function isFileIncluded(
  globs: ReadonlyArray<string>,
  dot: boolean,
  doIgnore: (path: string) => boolean,
  relativePath: string,
): boolean {
  if (doIgnore(relativePath)) {
    return false;
  }
  return globs.length > 0
    ? globs.some(glob => getMatcher(glob, dot)(relativePath))
    : dot || getMatcher('**/*', false)(relativePath);
}
