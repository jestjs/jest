/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import path from 'path';

export const escapePathForRegex = (dir: string) => {
  if (path.sep === '\\') {
    // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
    // replacePathSepForRegex will convert it back.
    dir = dir.replace(/\\/g, '/');
  }
  return replacePathSepForRegex(escapeStrForRegex(dir));
};

export const escapeStrForRegex = (string: string) =>
  string.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');

export const replacePathSepForRegex = (string: string) => {
  if (!string || path.sep !== '\\') {
    return string;
  }

  let result = '';
  for (let i = 0; i < string.length; i += 1) {
    const char = string[i];
    if (char === '\\') {
      const nextChar = string[i + 1];
      /* Case: \/ -- recreate legacy behavior */
      if (nextChar === '/') {
        i += 1;
        result += '\\\\\\\\';
        continue;
      }

      /* Case: \. */
      if (nextChar === '.') {
        i += 1;
        result += '\\.';
        continue;
      }

      /* Case: \\. */
      if (nextChar === '\\' && string[i + 2] === '.') {
        i += 2;
        result += '\\\\.';
        continue;
      }

      /* Case: \\ */
      if (nextChar === '\\') {
        i += 1;
        result += '\\\\';
        continue;
      }

      /* Case: \<other> */
      result += '\\\\';
      continue;
    }

    /* Case: / */
    if (char === '/') {
      result += '\\\\';
      continue;
    }

    result += char;
  }

  return result;
};
