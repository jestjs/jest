/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import type {Config} from '@jest/types';
import slash = require('slash');

export default class ModuleNotFoundError extends Error {
  code = 'MODULE_NOT_FOUND';
  public hint?: string;
  public requireStack?: Array<Config.Path>;
  public siblingWithSimilarExtensionFound?: boolean;
  public moduleName?: string;

  private _originalMessage?: string;

  constructor(message: string, moduleName?: string) {
    super(message);
    this._originalMessage = message;
    this.moduleName = moduleName;
  }

  public buildMessage(rootDir: Config.Path): void {
    if (!this._originalMessage) {
      this._originalMessage = this.message || '';
    }

    let message = this._originalMessage;

    if (this?.requireStack?.length && this!.requireStack!.length > 1) {
      message += `

Require stack:
  ${(this.requireStack as Array<string>)
    .map(p => p.replace(`${rootDir}${path.sep}`, ''))
    .map(slash)
    .join('\n  ')}
`;
    }

    if (this.hint) {
      message += this.hint;
    }

    this.message = message;
  }

  public static duckType(error: ModuleNotFoundError): ModuleNotFoundError {
    error.buildMessage = ModuleNotFoundError.prototype.buildMessage;
    return error;
  }
}
