/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fileURLToPath, pathToFileURL} from 'node:url';
import {existsSync, readFileSync} from 'graceful-fs';
import type {SourceMapFileReader} from './types';

// A scheme needs at least two characters before the colon, so a Windows drive
// letter is not mistaken for one.
const ABSOLUTE_URI_REGEXP = /^[a-zA-Z][\w+\-.]+:/;
const INLINE_SOURCE_MAP_REGEXP = /^data:application\/json[^,]+base64,/;

function toPath(url: string): string {
  if (!url.startsWith('file:')) {
    return url;
  }

  try {
    return fileURLToPath(url);
  } catch {
    return url;
  }
}

export const nodeFileReader: SourceMapFileReader = {
  read(urlOrPath) {
    if (urlOrPath.startsWith('data:')) {
      if (!INLINE_SOURCE_MAP_REGEXP.test(urlOrPath)) {
        return null;
      }

      const base64 = urlOrPath.slice(urlOrPath.indexOf(',') + 1);

      return Buffer.from(base64, 'base64').toString();
    }

    const filePath = toPath(urlOrPath);

    try {
      return existsSync(filePath) ? readFileSync(filePath, 'utf8') : null;
    } catch {
      return null;
    }
  },
  toPath,
  toUrl(pathOrUrl) {
    return ABSOLUTE_URI_REGEXP.test(pathOrUrl)
      ? pathOrUrl
      : pathToFileURL(pathOrUrl).href;
  },
};
