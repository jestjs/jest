/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

const spyProcessSend = jest.spyOn(process, 'send');

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

beforeEach(() => {
  mockCount = 0;
  ended = false;

  jest.mock(
    '../my-fancy-worker',
    () => {
      mockCount++;

      return {
        fooCircularResult() {
          const circular = {self: undefined as unknown};
          circular.self = circular;
          return {error: circular};
        },

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
    () => jest.fn().mockImplementation(() => 12_345),
    {virtual: true},
  );

  // This mock emulates a transpiled Babel module that carries a default export
  // that corresponds to a method.
  jest.mock(
    '../my-fancy-babel-worker',
    () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => 67_890),
    }),
    {virtual: true},
  );

  // Require the child!
  require('../processChild');
});

afterEach(() => {
  jest.clearAllMocks().resetModules();

  process.removeAllListeners('message');
});

it('lazily requires the file', () => {
  expect(mockCount).toBe(0);

  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-worker',
    ],
    null,
  );

  expect(mockCount).toBe(0);
  expect(initializeParm).toBe(uninitializedParam); // Not called yet.

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooWorks',
      [],
    ],
    null,
  );

  expect(mockCount).toBe(1);
  expect(initializeParm).toBeUndefined();
});

it('should return memory usage', () => {
  expect(mockCount).toBe(0);

  process.emit('message', [CHILD_MESSAGE_MEM_USAGE], null);

  expect(spyProcessSend.mock.calls[0][0]).toEqual([
    PARENT_MESSAGE_MEM_USAGE,
    expect.any(Number),
  ]);
});

it('calls initialize with the correct arguments', () => {
  expect(mockCount).toBe(0);

  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-worker',
      ['foo'], // Pass empty initialize params so the initialize method is called.
    ],
    null,
  );

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooWorks',
      [],
    ],
    null,
  );

  expect(initializeParm).toBe('foo');
});

it('returns results immediately when function is synchronous', () => {
  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-worker',
    ],
    null,
  );

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooWorks',
      [],
    ],
    null,
  );

  expect(spyProcessSend.mock.calls[0][0]).toEqual([PARENT_MESSAGE_OK, 1989]);

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooThrows',
      [],
    ],
    null,
  );

  expect(spyProcessSend.mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'TypeError',
    'Boo',
    mockError.stack,
    {},
  ]);

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooThrowsANumber',
      [],
    ],
    null,
  );

  expect(spyProcessSend.mock.calls[2][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'Number',
    void 0,
    void 0,
    412,
  ]);

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooThrowsAnErrorWithExtraProperties',
      [],
    ],
    null,
  );

  expect(spyProcessSend.mock.calls[3][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'MockExtendedError',
    'Boo extended',
    mockExtendedError.stack,
    {baz: 123, qux: 456},
  ]);

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooThrowsNull',
      [],
    ],
    null,
  );

  expect(spyProcessSend.mock.calls[4][0][0]).toBe(PARENT_MESSAGE_CLIENT_ERROR);
  expect(spyProcessSend.mock.calls[4][0][1]).toBe('Error');
  expect(spyProcessSend.mock.calls[4][0][2]).toBe(
    '"null" or "undefined" thrown',
  );

  expect(spyProcessSend).toHaveBeenCalledTimes(5);
});

it('returns results when it gets resolved if function is asynchronous', async () => {
  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-worker',
    ],
    null,
  );

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooPromiseWorks',
      [],
    ],
    null,
  );

  await sleep(10);

  expect(spyProcessSend.mock.calls[0][0]).toEqual([PARENT_MESSAGE_OK, 1989]);

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooPromiseThrows',
      [],
    ],
    null,
  );

  await sleep(10);

  expect(spyProcessSend.mock.calls[1][0]).toEqual([
    PARENT_MESSAGE_CLIENT_ERROR,
    'TypeError',
    'Boo',
    mockError.stack,
    {},
  ]);

  expect(spyProcessSend).toHaveBeenCalledTimes(2);
});

it('returns results with circular references', () => {
  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-worker',
    ],
    null,
  );

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'fooCircularResult',
      [],
    ],
    null,
  );

  const processCallError = spyProcessSend.mock.calls[0][0][1].error;
  expect(processCallError.self).toBe(processCallError.self.self);
});

it('calls the main module if the method call is "default"', () => {
  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-standalone-worker',
    ],
    null,
  );

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'default',
      [],
    ],
    null,
  );

  expect(spyProcessSend.mock.calls[0][0]).toEqual([PARENT_MESSAGE_OK, 12_345]);
});

it('calls the main export if the method call is "default" and it is a Babel transpiled one', () => {
  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-babel-worker',
    ],
    null,
  );

  process.emit(
    'message',
    [
      CHILD_MESSAGE_CALL,
      true, // Not really used here, but for type purity.
      'default',
      [],
    ],
    null,
  );

  expect(spyProcessSend.mock.calls[0][0]).toEqual([PARENT_MESSAGE_OK, 67_890]);
});

it('removes the message listener on END message', () => {
  // So that there are no more open handles preventing Node from exiting
  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-worker',
    ],
    null,
  );

  process.emit('message', [CHILD_MESSAGE_END], null);

  expect(process.listenerCount('message')).toBe(0);
});

it('calls the teardown method ', () => {
  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-worker',
    ],
    null,
  );

  process.emit(
    'message',
    [
      CHILD_MESSAGE_END,
      true, // Not really used here, but for type purity.
    ],
    null,
  );

  expect(ended).toBe(true);
});

it('throws if an invalid message is detected', () => {
  // Type 27 does not exist.
  expect(() => {
    process.emit('message', [27], null);
  }).toThrow(TypeError);
});

it('throws if child is not forked', () => {
  delete process.send;

  process.emit(
    'message',
    [
      CHILD_MESSAGE_INITIALIZE,
      true, // Not really used here, but for type purity.
      './my-fancy-worker',
    ],
    null,
  );

  expect(() => {
    process.emit(
      'message',
      [
        CHILD_MESSAGE_CALL,
        true, // Not really used here, but for type purity.
        'fooWorks',
        [],
      ],
      null,
    );
  }).toThrow('Child can only be used on a forked process');

  expect(() => {
    process.emit(
      'message',
      [
        CHILD_MESSAGE_CALL,
        true, // Not really used here, but for type purity.
        'fooThrows',
        [],
      ],
      null,
    );
  }).toThrow('Child can only be used on a forked process');
});
