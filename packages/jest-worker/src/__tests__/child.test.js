/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import EventEmitter from 'events';

const mockError = new TypeError('Booo');
const mockExtendedError = new ReferenceError('Booo extended');
const processExit = process.exit;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

import {
  CHILD_MESSAGE_INITIALIZE,
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_END,
  PARENT_MESSAGE_OK,
  PARENT_MESSAGE_ERROR,
} from '../types';

let mockCount;
let channel;

beforeEach(() => {
  mockCount = 0;

  jest.mock('net').mock('../channel');

  jest.mock(
    '../my-fancy-worker',
    () => {
      mockCount++;

      return {
        fooPromiseThrows() {
          return new Promise((resolve, reject) => {
            setTimeout(() => reject(mockError), 5);
          });
        },

        fooPromiseWorks() {
          return new Promise((resolve, reject) => {
            setTimeout(() => resolve(1989), 5);
          });
        },

        fooThrows() {
          throw mockError;
        },

        fooThrowsANumber() {
          // eslint-disable-next-line no-throw-literal
          throw 412;
        },

        fooThrowsAnErrorWithExtraProperties() {
          mockExtendedError.baz = 123;
          mockExtendedError.qux = 456;

          throw mockExtendedError;
        },

        fooThrowsNull() {
          // eslint-disable-next-line no-throw-literal
          throw null;
        },

        fooWorks() {
          return 1989;
        },
      };
    },
    {virtual: true},
  );

  jest.mock(
    '../my-fancy-standalone-worker',
    () => jest.fn().mockImplementation(() => 12345),
    {virtual: true},
  );

  // This mock emulates a transpiled Babel module that carries a default export
  // that corresponds to a method.
  jest.mock(
    '../my-fancy-babel-worker',
    () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => 67890),
    }),
    {virtual: true},
  );

  require('../channel').default.mockImplementation(() => {
    channel = Object.assign(new EventEmitter(), {
      send: jest.fn(),
    });

    return channel;
  });

  process.exit = jest.fn();

  // Require the child!
  require('../child');
});

afterEach(() => {
  process.exit = processExit;
  jest.resetModules();
});

it('lazily requires the file', () => {
  expect(mockCount).toBe(0);

  channel.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true, // Not really used here, but for flow type purity.
    './my-fancy-worker',
  ]);

  expect(mockCount).toBe(0);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'fooWorks',
    [],
  ]);

  expect(mockCount).toBe(1);
});

it('returns results immediately when function is synchronous', () => {
  channel.send = jest.fn();

  channel.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true, // Not really used here, but for flow type purity.
    './my-fancy-worker',
  ]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'fooWorks',
    [],
  ]);

  expect(channel.send.mock.calls[0][0]).toEqual([PARENT_MESSAGE_OK, 1989]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'fooThrows',
    [],
  ]);

  expect(channel.send.mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_ERROR,
    'TypeError',
    'Booo',
    mockError.stack,
    {},
  ]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'fooThrowsANumber',
    [],
  ]);

  expect(channel.send.mock.calls[2][0]).toEqual([
    PARENT_MESSAGE_ERROR,
    'Number',
    void 0,
    void 0,
    412,
  ]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'fooThrowsAnErrorWithExtraProperties',
    [],
  ]);

  expect(channel.send.mock.calls[3][0]).toEqual([
    PARENT_MESSAGE_ERROR,
    'ReferenceError',
    'Booo extended',
    mockExtendedError.stack,
    {baz: 123, qux: 456},
  ]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'fooThrowsNull',
    [],
  ]);

  expect(channel.send.mock.calls[4][0][0]).toBe(PARENT_MESSAGE_ERROR);
  expect(channel.send.mock.calls[4][0][1]).toBe('Error');
  expect(channel.send.mock.calls[4][0][2]).toEqual(
    '"null" or "undefined" thrown',
  );

  expect(channel.send).toHaveBeenCalledTimes(5);
});

it('returns results when it gets resolved if function is asynchronous', async () => {
  jest.useRealTimers();

  channel.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true, // Not really used here, but for flow type purity.
    './my-fancy-worker',
  ]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'fooPromiseWorks',
    [],
  ]);

  await sleep(10);

  expect(channel.send.mock.calls[0][0]).toEqual([PARENT_MESSAGE_OK, 1989]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'fooPromiseThrows',
    [],
  ]);

  await sleep(10);

  expect(channel.send.mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_ERROR,
    'TypeError',
    'Booo',
    mockError.stack,
    {},
  ]);

  expect(channel.send).toHaveBeenCalledTimes(2);
});

it('calls the main module if the method call is "default"', () => {
  channel.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true, // Not really used here, but for flow type purity.
    './my-fancy-standalone-worker',
  ]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'default',
    [],
  ]);

  expect(channel.send.mock.calls[0][0]).toEqual([PARENT_MESSAGE_OK, 12345]);
});

it('calls the main export if the method call is "default" and it is a Babel transpiled one', () => {
  channel.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true, // Not really used here, but for flow type purity.
    './my-fancy-babel-worker',
  ]);

  channel.emit('message', [
    CHILD_MESSAGE_CALL,
    true, // Not really used here, but for flow type purity.
    'default',
    [],
  ]);

  expect(channel.send.mock.calls[0][0]).toEqual([PARENT_MESSAGE_OK, 67890]);
});

it('finishes the process with exit code 0 if requested', () => {
  channel.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true, // Not really used here, but for flow type purity.
    './my-fancy-worker',
  ]);

  channel.emit('message', [
    CHILD_MESSAGE_END,
    true, // Not really used here, but for flow type purity.
  ]);

  expect(process.exit.mock.calls[0]).toEqual([0]);
});

it('throws if an invalid message is detected', () => {
  // Type 27 does not exist.
  expect(() => {
    channel.emit('message', [27]);
  }).toThrow(TypeError);
});
