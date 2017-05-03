/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

declare module "console" {
  declare export class Console {
    constructor(stdout: mixed, stderr: mixed): void;
    assert(value: mixed, message?: string, ...messageParts: Array<mixed>): void;
    dir(data: mixed, options?: Object): void;

    error(msg: string, ...msgParts: Array<mixed>): void;
    error(data: mixed): void;

    info(msg: string, ...msgParts: Array<mixed>): void;
    info(data: mixed): void;

    log(msg: string, ...msgParts: Array<mixed>): void;
    log(data: mixed): void;

    time(label: string): void;
    timeEnd(label: string): void;
    trace(msg: string, ...msgParts: Array<mixed>): void;

    warn(msg: string, ...msgParts: Array<mixed>): void;
    warn(data: mixed): void;
  }
}
