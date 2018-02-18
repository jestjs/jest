/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import EventEmitter from 'events';
import Comms from '../comms';
import serializer from 'jest-serializer';

let stream;
let comms;

beforeEach(() => {
  stream = Object.assign(new EventEmitter(), {
    write: jest.fn(),
  });

  comms = new Comms(stream);
});

it('sends data prefixed with length', () => {
  const data = {
    bar: [0, true, '2'],
    foo: 42,
  };

  const buffer = serializer.serialize(data);

  comms.send(data);

  // Verify that the length is sent first.
  expect(stream.write.mock.calls[0]).toEqual([
    new Buffer([buffer.length, 0, 0, 0]),
  ]);

  // Then the corresponding serialized message as a buffer.
  expect(stream.write.mock.calls[1]).toEqual([buffer]);
});

it('processes a single message split into different buffers', () => {
  const data = {
    bar: [0, true, '2'],
    foo: 42,
  };

  const message = serializer.serialize(data);
  const received = jest.fn();

  comms.on('message', received);

  // Just received the length.
  stream.emit('data', Buffer.from([message.length, 0, 0, 0]));
  expect(received).not.toBeCalled();

  // Now received half of the buffer.
  stream.emit('data', message.slice(0, message.length / 2));
  expect(received).not.toBeCalled();

  // And now the full buffer.
  stream.emit('data', message.slice(message.length / 2));
  expect(received).toHaveBeenCalledTimes(1);

  expect(received.mock.calls[0][0]).toEqual(data);
});

it('can process multiple messages into a single buffer', () => {
  const data1 = {
    bar: [0, true, '2'],
    foo: 42,
  };

  const data2 = [null, 'red', {}];

  const message1 = serializer.serialize(data1);
  const message2 = serializer.serialize(data2);
  const message = Buffer.allocUnsafe(8 + message1.length + message2.length);
  const received = jest.fn();

  message.writeUInt32LE(message1.length, 0);
  message1.copy(message, 4);

  message.writeUInt32LE(message2.length, 4 + message1.length);
  message2.copy(message, 8 + message1.length);

  comms.on('message', received);
  stream.emit('data', message);

  expect(received).toHaveBeenCalledTimes(2);
  expect(received.mock.calls[0][0]).toEqual(data1);
  expect(received.mock.calls[1][0]).toEqual(data2);
});
