/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Writable} from 'stream';

type Callback = (error: Error | null | undefined) => void;
type Encoding = string | undefined;

class Output {
  private _stdout: NodeJS.WriteStream;
  private _stderr: NodeJS.WriteStream;

  constructor() {
    this._stdout = process.stdout;
    this._stderr = process.stderr;
  }

  get isTTY() {
    return (this._stdout as NodeJS.WriteStream).isTTY;
  }

  error(chunk: any, encoding?: Encoding, callback?: Callback) {
    return this._stderr.write(chunk, encoding, callback);
  }

  log(chunk: any, encoding?: Encoding, callback?: Callback) {
    return this._stdout.write(chunk, encoding, callback);
  }

  setErrorStream(stream: NodeJS.WriteStream | Writable) {
    this._stderr = stream as NodeJS.WriteStream;
  }

  setLogStream(stream: NodeJS.WriteStream | Writable) {
    this._stdout = stream as NodeJS.WriteStream;
  }
}

export default new Output();
