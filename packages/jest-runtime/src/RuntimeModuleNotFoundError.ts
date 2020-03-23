/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {ModuleNotFoundError} from 'jest-resolve';
import {Config} from '@jest/types';
import slash = require('slash');

export default class RuntimeModuleNotFoundError extends ModuleNotFoundError {
  public hint?: string;
  public requireStack?: Array<Config.Path>;
  public stackTraceBuilt?: boolean;

  public static buildMessage(
    error: RuntimeModuleNotFoundError,
    rootDir: Config.Path,
  ): void {
    if (
      !error.stackTraceBuilt &&
      error?.requireStack?.length &&
      error?.requireStack?.length > 1
    ) {
      error.message += `

Require stack:
  ${(error.requireStack as Array<string>)
    .map(p => p.replace(`${rootDir}${path.sep}`, ''))
    .map(slash)
    .join('\n  ')}
`;
      error.stackTraceBuilt = true;
    }

    if (error.hint) {
      error.message += error.hint;
    }
  }
}
