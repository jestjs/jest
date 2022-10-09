/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_END,
  CHILD_MESSAGE_INITIALIZE,
  CHILD_MESSAGE_MEM_USAGE,
  PARENT_MESSAGE_CLIENT_ERROR,
  PARENT_MESSAGE_MEM_USAGE,
  PARENT_MESSAGE_OK,
} from '../../types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      emit(event: 'message', message: any): this; // overrides DT type, which requires the third argument
    }
  }
}

// Process

class MockExtendedError extends ReferenceError {
  baz = 123;
  qux = 456;
}

const mockError = new TypeError('Boo');
const mockExtendedError = new MockExtendedError('Boo extended');
const processExit = process.exit;
const processSend = process.send;
const uninitializedParam = {};
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let ended: boolean;
let mockCount: number;
let initializeParm = uninitializedParam;

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

  process.exit = jest.fn<typeof process.exit>();
  process.send = jest.fn<NonNullable<typeof process.send>>();

  // Require the child!
  require('../processChild');
});

afterEach(() => {
  jest.resetModules();

  process.removeAllListeners('message');

  process.exit = processExit;
  process.send = processSend;
});

it('lazily requires the file', () => {
  expect(mockCount).toBe(0);

  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  expect(mockCount).toBe(0);
  expect(initializeParm).toBe(uninitializedParam); // Not called yet.

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);

  expect(mockCount).toBe(1);
  expect(initializeParm).toBeUndefined();
});

it('should return memory usage', () => {
  process.send = jest.fn<NonNullable<typeof process.send>>();

  expect(mockCount).toBe(0);

  process.emit('message', [CHILD_MESSAGE_MEM_USAGE]);

  expect(jest.mocked(process.send!).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_MEM_USAGE,
    expect.any(Number),
  ]);
});

it('calls initialize with the correct arguments', () => {
  expect(mockCount).toBe(0);

  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
    ['foo'], // Pass empty initialize params so the initialize method is called.
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);

  expect(initializeParm).toBe('foo');
});

it('returns results immediately when function is synchronous', () => {
  process.send = jest.fn<NonNullable<typeof process.send>>();

  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);

  expect(jest.mocked(process.send!).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_OK,
    1989,
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooThrows', []]);

  expect(jest.mocked(process.send!).mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'TypeError',
    'Boo',
    mockError.stack,
    {},
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooThrowsANumber', []]);

  expect(jest.mocked(process.send!).mock.calls[2][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'Number',
    void 0,
    void 0,
    412,
  ]);

  process.emit('message', [
    CHILD_MESSAGE_CALL,
    true,
    'fooThrowsAnErrorWithExtraProperties',
    [],
  ]);

  expect(jest.mocked(process.send!).mock.calls[3][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'MockExtendedError',
    'Boo extended',
    mockExtendedError.stack,
    {baz: 123, qux: 456},
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooThrowsNull', []]);

  expect(jest.mocked(process.send!).mock.calls[4][0][0]).toBe(
    PARENT_MESSAGE_CLIENT_ERROR,
  );
  expect(jest.mocked(process.send!).mock.calls[4][0][1]).toBe('Error');
  expect(jest.mocked(process.send!).mock.calls[4][0][2]).toBe(
    '"null" or "undefined" thrown',
  );

  expect(process.send).toHaveBeenCalledTimes(5);
});

it('returns results when it gets resolved if function is asynchronous', async () => {
  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooPromiseWorks', []]);

  await sleep(10);

  expect(jest.mocked(process.send!).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_OK,
    1989,
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooPromiseThrows', []]);

  await sleep(10);

  expect(jest.mocked(process.send!).mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'TypeError',
    'Boo',
    mockError.stack,
    {},
  ]);

  expect(process.send).toHaveBeenCalledTimes(2);
});

it('calls the main module if the method call is "default"', () => {
  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-standalone-worker',
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'default', []]);

  expect(jest.mocked(process.send!).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_OK,
    12345,
  ]);
});

it('calls the main export if the method call is "default" and it is a Babel transpiled one', () => {
  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-babel-worker',
  ]);

  process.emit('message', [CHILD_MESSAGE_CALL, true, 'default', []]);

  expect(jest.mocked(process.send!).mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_OK,
    67890,
  ]);
});

it('removes the message listener on END message', () => {
  // So that there are no more open handles preventing Node from exiting
  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  process.emit('message', [CHILD_MESSAGE_END]);

  expect(process.listenerCount('message')).toBe(0);
});

it('calls the teardown method ', () => {
  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  process.emit('message', [CHILD_MESSAGE_END, true]);

  expect(ended).toBe(true);
});

it('throws if an invalid message is detected', () => {
  // Type 27 does not exist.
  expect(() => {
    process.emit('message', [27]);
  }).toThrow(TypeError);
});

it('throws if child is not forked', () => {
  delete process.send;

  process.emit('message', [
    CHILD_MESSAGE_INITIALIZE,
    true,
    './my-fancy-worker',
  ]);

  expect(() => {
    process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooWorks', []]);
  }).toThrow('Child can only be used on a forked process');

  expect(() => {
    process.emit('message', [CHILD_MESSAGE_CALL, true, 'fooThrows', []]);
  }).toThrow('Child can only be used on a forked process');
});
