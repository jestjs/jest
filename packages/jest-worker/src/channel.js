/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import EventEmitter from 'events';
import serializer from 'jest-serializer';

import type {Duplex} from 'stream';

/**
 * This class provides an thin layer to send objects over a socket by using the
 * best available serialization mechanism, which is in turn provided by the
 * jest-serializer module.
 *
 * In order to send, the payload is encoded as a buffer, and a 4-byte unsigned
 * integer with the size is added at the front. When receiving, buffers are
 * saved until there is enough information to parse a payload, then a "message"
 * event is emitted.
 */
export default class extends EventEmitter {
  _size: Buffer;
  _stream: Duplex;

  _receiveBuffers: Array<Buffer>;
  _receiveBytes: number;
  _receiveSize: number;

  constructor(stream: Duplex) {
    super();

    this._size = Buffer.allocUnsafe(4);
    this._stream = stream;
    this._clearReceive();

    stream.on('data', this._receive.bind(this));
  }

  send(message: any) {
    const buffer = serializer.serialize(message);
    const size = this._size;
    const stream = this._stream;

    size.writeUInt32LE(buffer.length, 0);

    stream.write(size);
    stream.write(buffer);
  }

  _receive(buffer: Buffer) {
    // First time receiving, so the size is encoded at the four first bytes.
    if (!this._receiveBytes) {
      this._receiveSize = buffer.readUInt32LE(0);
    }

    const receiveBuffers = this._receiveBuffers;
    const receiveBytes = (this._receiveBytes += buffer.length);
    const receiveSize = this._receiveSize;

    receiveBuffers.push(buffer);

    // Not enough data yet; so just store the buffer in the list and return.
    if (receiveBytes < receiveSize) {
      return;
    }

    const all = Buffer.concat(receiveBuffers, receiveBytes);
    const message = all.slice(4, receiveSize + 4);
    const rest = all.slice(receiveSize + 4);

    this.emit('message', serializer.deserialize(message));

    // Clean the queue and call recursively if there is any data left.
    this._clearReceive();

    if (rest.length) {
      this._receive(rest);
    }
  }

  _clearReceive() {
    this._receiveBuffers = [];
    this._receiveBytes = 0;
    this._receiveSize = 0;
  }
}
