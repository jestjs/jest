/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {HasteRegExp} from '../types';

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

export function buildIgnoreMatcher(
  ignorePattern: HasteRegExp | undefined,
  retainAllFiles: boolean,
): (filePath: string) => boolean {
  return (filePath: string) => {
    const ignoreMatched =
      ignorePattern instanceof RegExp
        ? ignorePattern.test(filePath)
        : ignorePattern && ignorePattern(filePath);
    return (
      Boolean(ignoreMatched) ||
      (!retainAllFiles && filePath.includes(NODE_MODULES))
    );
  };
}
