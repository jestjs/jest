/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'events';
import type {MessagePort} from 'worker_threads';
import {
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_END,
  CHILD_MESSAGE_INITIALIZE,
  PARENT_MESSAGE_CLIENT_ERROR,
  PARENT_MESSAGE_OK,
} from '../../types';

class MockedParentPort extends EventEmitter {
  postMessage = jest.fn();
}

jest.mock('worker_threads', () => {
  return {
    isMainThread: false,
    parentPort: new MockedParentPort(),
  };
});

class MockExtendedError extends ReferenceError {
  baz = 123;
  qux = 456;
}

const mockError = new TypeError('Boo');
const mockExtendedError = new MockExtendedError('Boo extended');
const uninitializedParam = {};
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let ended: boolean;
let mockCount: number;
let initializeParm = uninitializedParam;

let messagePort: MessagePort;

beforeEach(() => {
  mockCount = 0;
  ended = false;

  jest.mock(
    '../my-fancy-worker',
    () => {
      mockCount++;

      return {
        fooPromiseThrows() {
          return new Promise((_resolve, reject) => {
            setTimeout(() => reject(mockError), 5);
          });
        },

        fooPromiseWorks() {
          return new Promise(resolve => {
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
          throw mockExtendedError;
        },

        fooThrowsNull() {
          // eslint-disable-next-line no-throw-literal
          throw null;
        },

        fooWorks() {
          return 1989;
        },

        setup(param: Record<string, unknown>) {
          initializeParm = param;
        },

        teardown() {
          ended = true;
        },
      };
    },
    {virtual: true},
  );

  jest.mock('../my-fancy-standalone-worker', () => jest.fn(() => 12345), {
    virtual: true,
  });

  // This mock emulates a transpiled Babel module that carries a default export
  // that corresponds to a method.
  jest.mock(
    '../my-fancy-babel-worker',
    () => ({
      __esModule: true,
      default: jest.fn(() => 67890),
    }),
    {virtual: true},
  );

  messagePort = (require('worker_threads') as typeof import('worker_threads'))
    .parentPort!;

  // Require the child!
  require('../threadChild');
});

beforeEach(() => {
  jest.mocked(messagePort.postMessage).mockClear();
});

afterEach(() => {
  jest.resetModules();

  messagePort.removeAllListeners('message');
});

it('sets env.JEST_WORKER_ID', () => {
  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
    [],
    '3',
  ]);

  expect(process.env.JEST_WORKER_ID).toBe('3');
});

it('lazily requires the file', () => {
  expect(mockCount).toBe(0);

  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  expect(mockCount).toBe(0);
  expect(initializeParm).toBe(uninitializedParam); // Not called yet.

  messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);

  expect(mockCount).toBe(1);
  expect(initializeParm).toBeUndefined();
});

it('calls initialize with the correct arguments', () => {
  expect(mockCount).toBe(0);

  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
    ['foo'], // Pass empty initialize params so the initialize method is called.
  ]);

  messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);

  expect(initializeParm).toBe('foo');
});

it('returns results immediately when function is synchronous', () => {
  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);

  expect(jest.mocked(messagePort.postMessage).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_OK,
    1989,
  ]);

  messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'fooThrows', []]);

  expect(jest.mocked(messagePort.postMessage).mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'TypeError',
    'Boo',
    mockError.stack,
    {},
  ]);

  messagePort.emit('message', [
    CHILD_MESSAGE_CALL,
    true,
    'fooThrowsANumber',
    [],
  ]);

  expect(jest.mocked(messagePort.postMessage).mock.calls[2][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'Number',
    void 0,
    void 0,
    412,
  ]);

  messagePort.emit('message', [
    CHILD_MESSAGE_CALL,
    true,
    'fooThrowsAnErrorWithExtraProperties',
    [],
  ]);

  expect(jest.mocked(messagePort.postMessage).mock.calls[3][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'MockExtendedError',
    'Boo extended',
    mockExtendedError.stack,
    {baz: 123, qux: 456},
  ]);

  messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'fooThrowsNull', []]);

  expect(jest.mocked(messagePort.postMessage).mock.calls[4][0][0]).toBe(
    PARENT_MESSAGE_CLIENT_ERROR,
  );
  expect(jest.mocked(messagePort.postMessage).mock.calls[4][0][1]).toBe(
    'Error',
  );
  expect(jest.mocked(messagePort.postMessage).mock.calls[4][0][2]).toBe(
    '"null" or "undefined" thrown',
  );

  expect(messagePort.postMessage).toHaveBeenCalledTimes(5);
});

it('returns results when it gets resolved if function is asynchronous', async () => {
  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  messagePort.emit('message', [
    CHILD_MESSAGE_CALL,
    true,
    'fooPromiseWorks',
    [],
  ]);

  await sleep(10);

  expect(jest.mocked(messagePort.postMessage).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_OK,
    1989,
  ]);

  messagePort.emit('message', [
    CHILD_MESSAGE_CALL,
    true,
    'fooPromiseThrows',
    [],
  ]);

  await sleep(10);

  expect(jest.mocked(messagePort.postMessage).mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'TypeError',
    'Boo',
    mockError.stack,
    {},
  ]);

  expect(messagePort.postMessage).toHaveBeenCalledTimes(2);
});

it('calls the main module if the method call is "default"', () => {
  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-standalone-worker',
  ]);

  messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'default', []]);

  expect(jest.mocked(messagePort.postMessage).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_OK,
    12345,
  ]);
});

it('calls the main export if the method call is "default" and it is a Babel transpiled one', () => {
  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-babel-worker',
  ]);

  messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'default', []]);

  expect(jest.mocked(messagePort.postMessage).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_OK,
    67890,
  ]);
});

it('removes the message listener on END message', () => {
  // So that there are no more open handles preventing Node from exiting
  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  messagePort.emit('message', [CHILD_MESSAGE_END, true]);

  expect(messagePort.listenerCount('message')).toBe(0);
});

it('calls the teardown method ', () => {
  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  messagePort.emit('message', [CHILD_MESSAGE_END, true]);

  expect(ended).toBe(true);
});

it('throws if an invalid message is detected', () => {
  // Type 27 does not exist.
  expect(() => {
    messagePort.emit('message', [27]);
  }).toThrow(TypeError);
});

it('throws if child is not forked', () => {
  // @ts-expect-error: Testing purpose
  delete messagePort.postMessage;

  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  expect(() => {
    messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);
  }).toThrow('_worker_threads.parentPort.postMessage is not a function');

  expect(() => {
    messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'fooThrows', []]);
  }).toThrow('_worker_threads.parentPort.postMessage is not a function');
});

it('handle error if `postMessage` throws an error', () => {
  messagePort.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  jest.mocked(messagePort.postMessage).mockImplementationOnce(() => {
    throw mockError;
  });

  messagePort.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);
  expect(jest.mocked(messagePort.postMessage).mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'TypeError',
    'Boo',
    mockError.stack,
    {},
  ]);
});
