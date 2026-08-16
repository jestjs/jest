/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fileURLToPath, pathToFileURL} from 'node:url';
import {fromComment} from 'convert-source-map';
import {existsSync, readFileSync} from 'graceful-fs';
import type {SourceMapFileReader} from './types';

// A scheme needs at least two characters before the colon, so a Windows drive
// letter is not mistaken for one.
const ABSOLUTE_URI_REGEXP = /^[a-zA-Z][\w+\-.]+:/;

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
      try {
        // Reads both the base64 and the URI encoding the spec allows. Takes a
        // whole comment rather than the URL on its own.
        return fromComment(`//# sourceMappingURL=${urlOrPath}`).toObject();
      } catch {
        return null;
      }
    }

    // A resource named by any other scheme — `node:internal/…`,
    // `webpack:///…` — cannot be read off disk.
    if (ABSOLUTE_URI_REGEXP.test(urlOrPath) && !urlOrPath.startsWith('file:')) {
      return null;
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
