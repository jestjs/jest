/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isAbsolute} from 'path';
import {pathToFileURL} from 'url';
import interopRequireDefault from './interopRequireDefault';

async function importModule(
  filePath: string,
  applyInteropRequireDefault: boolean,
) {
  try {
    const moduleUrl = pathToFileURL(filePath);

    // node `import()` supports URL, but TypeScript doesn't know that
    const importedModule = await import(
      /* webpackIgnore: true */ moduleUrl.href
    );

    if (!applyInteropRequireDefault) {
      return importedModule;
    }

    if (!importedModule.default) {
      throw new Error(
        `Jest: Failed to load ESM at ${filePath} - did you use a default export?`,
      );
    }

    return importedModule.default;
  } catch (error: any) {
    if (error.message === 'Not supported') {
      throw new Error(
        `Jest: Your version of Node does not support dynamic import - please enable it or use a .cjs file extension for file ${filePath}`,
      );
    }
    throw error;
  }
}

export default async function requireOrImportModule<T>(
  filePath: string,
  applyInteropRequireDefault = true,
): Promise<T> {
  if (!isAbsolute(filePath) && filePath[0] === '.') {
    throw new Error(
      `Jest: requireOrImportModule path must be absolute, was "${filePath}"`,
    );
  }
  try {
    if (filePath.endsWith('.mjs')) {
      return importModule(filePath, applyInteropRequireDefault);
    }

    const requiredModule = require(filePath);
    if (!applyInteropRequireDefault) {
      return requiredModule;
    }
    return interopRequireDefault(requiredModule).default;
  } catch (error: any) {
    if (
      error.code === 'ERR_REQUIRE_ESM' ||
      error.code === 'ERR_REQUIRE_ASYNC_MODULE'
    ) {
      return importModule(filePath, applyInteropRequireDefault);
    } else {
      throw error;
    }
  }
}
