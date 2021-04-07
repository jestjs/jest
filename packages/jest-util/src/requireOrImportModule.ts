/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isAbsolute} from 'path';
import {pathToFileURL} from 'url';
import type {Config} from '@jest/types';
import interopRequireDefault from './interopRequireDefault';

export default async function requireOrImportModule<T>(
  filePath: Config.Path,
): Promise<T> {
  let module: T;
  if (!isAbsolute(filePath) && filePath[0] === '.') {
    throw new Error(`Jest: requireOrImportModule path must be absolute`);
  }
  try {
    module = interopRequireDefault(require(filePath)).default;
  } catch (error) {
    if (error.code === 'ERR_REQUIRE_ESM') {
      try {
        const configUrl = pathToFileURL(filePath);

        // node `import()` supports URL, but TypeScript doesn't know that
        const importedConfig = await import(configUrl.href);

        if (!importedConfig.default) {
          throw new Error(
            `Jest: Failed to load ESM at ${filePath} - did you use a default export?`,
          );
        }

        module = importedConfig.default;
      } catch (innerError) {
        if (innerError.message === 'Not supported') {
          throw new Error(
            `Jest: Your version of Node does not support dynamic import - please enable it or use a .cjs file extension for file ${filePath}`,
          );
        }
        throw innerError;
      }
    } else {
      throw error;
    }
  }
  return module;
}
