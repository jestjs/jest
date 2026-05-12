/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {sep} from 'path';

export const escapePathForRegex = (dir: string): string => {
  if (sep === '\\') {
    // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
    // replacePathSepForRegex will convert it back.
    dir = dir.replaceAll('\\', '/');
  }
  return replacePathSepForRegex(escapeStrForRegex(dir));
};

export const escapeStrForRegex = (string: string): string =>
  string.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');

export const replacePathSepForRegex = (string: string): string => {
  if (sep === '\\') {
    return string.replaceAll(
      /(\/|(.)?\\(?![$()*+.?[\\\]^{|}]))/g,
      (_match, _, p2) => (p2 && p2 !== '\\' ? `${p2}\\\\` : '\\\\'),
    );
  }
  return string;
};
