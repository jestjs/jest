/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/* eslint-disable no-new */

const {EventEmitter} = require('events');

const {
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_INITIALIZE,
  PARENT_MESSAGE_ERROR,
  PARENT_MESSAGE_OK,
} = require('../types');

let Worker;
let forkInterface;
let childProcess;

beforeEach(() => {
  forkInterface = Object.assign(new EventEmitter(), {
    send: jest.fn(),
    stderr: {},
    stdout: {},
  });

  jest.mock('child_process');

  childProcess = require('child_process');
  childProcess.fork.mockImplementation(() => forkInterface);

  Worker = require('../worker');
});

afterEach(() => {
  jest.resetModules();
});

it('passes fork options down to child_process.fork, adding the defaults', () => {
  const child = require.resolve('../child');
  new Worker({
    forkOptions: {
      cwd: '/tmp',
      execArgv: ['--no-warnings'],
    },
    workerPath: '/tmp/foo/bar/baz.js',
  });

  expect(childProcess.fork.mock.calls[0][0]).toBe(child);
  expect(childProcess.fork.mock.calls[0][1]).toEqual({
    cwd: '/tmp', // Overridden default option.
    env: process.env, // Default option.
    execArgv: ['--no-warnings'], // Added option.
    silent: true, // Default option.
  });
});

it('initializes the child process with the given workerPath', () => {
  new Worker({
    workerPath: '/tmp/foo/bar/baz.js',
  });

  expect(forkInterface.send.mock.calls[0][0]).toEqual([
    CHILD_MESSAGE_INITIALIZE,
    false,
    '/tmp/foo/bar/baz.js',
  ]);
});

it('provides stdout and stderr fields from the child process', () => {
  const worker = new Worker({
    workerPath: '/tmp/foo',
  });

  expect(worker.getStdout()).toBe(forkInterface.stdout);
  expect(worker.getStderr()).toBe(forkInterface.stderr);
});

it('swtiches the processed flag of a task as soon as it is processed', () => {
  const worker = new Worker({
    workerPath: '/tmp/foo',
  });

  const request1 = [CHILD_MESSAGE_CALL, false, 'foo', []];
  const request2 = [CHILD_MESSAGE_CALL, false, 'bar', []];

  worker.send(request1, () => {});
  worker.send(request2, () => {});

  // The queue is empty when it got send, so the task is processed.
  expect(request1[1]).toBe(true);

  // The previous one is being processed, so that one stays as unprocessed.
  expect(request2[1]).toBe(false);
});

it('sends the task to the child process', () => {
  const worker = new Worker({
    workerPath: '/tmp/foo',
  });

  const request = [CHILD_MESSAGE_CALL, false, 'foo', []];

  worker.send(request, () => {});

  // Skipping call "0" because it corresponds to the "initialize" one.
  expect(forkInterface.send.mock.calls[1][0]).toEqual(request);
});

it('relates replies to requests, in order', () => {
  const worker = new Worker({
    workerPath: '/tmp/foo',
  });

  const callback1 = jest.fn();
  const request1 = [CHILD_MESSAGE_CALL, false, 'foo', []];

  const callback2 = jest.fn();
  const request2 = [CHILD_MESSAGE_CALL, false, 'bar', []];

  worker.send(request1, callback1);
  worker.send(request2, callback2);

  // 2nd call waits on the queue...
  expect(request2[1]).toBe(false);

  // then first call replies...
  forkInterface.emit('message', [PARENT_MESSAGE_OK, 44]);

  expect(callback1.mock.calls[0][0]).toBeFalsy();
  expect(callback1.mock.calls[0][1]).toBe(44);
  expect(callback1.mock.instances[0]).toBe(worker);

  // which causes the second call to be processed...
  expect(request2[1]).toBe(true);

  // and then the second call replies...
  forkInterface.emit('message', [
    PARENT_MESSAGE_ERROR,
    'TypeError',
    'foo',
    'TypeError: foo',
  ]);

  expect(callback2.mock.calls[0][0].message).toBe('foo');
  expect(callback2.mock.instances[0]).toBe(worker);
});

it('creates error instances for known errors', () => {
  const worker = new Worker({
    workerPath: '/tmp/foo',
  });

  const callback1 = jest.fn();
  const callback2 = jest.fn();

  // Testing a generic ECMAScript error.
  worker.send([CHILD_MESSAGE_CALL, false, 'method', []], callback1);

  forkInterface.emit('message', [
    PARENT_MESSAGE_ERROR,
    'TypeError',
    'bar',
    'TypeError: bar',
  ]);

  expect(callback1.mock.calls[0][0]).toBeInstanceOf(TypeError);
  expect(callback1.mock.calls[0][0].message).toBe('bar');
  expect(callback1.mock.calls[0][0].type).toBe('TypeError');
  expect(callback1.mock.calls[0][0].stack).toBe('TypeError: bar');

  // Testing a custom error.
  worker.send([CHILD_MESSAGE_CALL, false, 'method', []], callback2);

  forkInterface.emit('message', [
    PARENT_MESSAGE_ERROR,
    'RandomCustomError',
    'bar',
    'RandomCustomError: bar',
  ]);

  expect(callback2.mock.calls[0][0]).toBeInstanceOf(Error);
  expect(callback2.mock.calls[0][0].message).toBe('bar');
  expect(callback2.mock.calls[0][0].type).toBe('RandomCustomError');
  expect(callback2.mock.calls[0][0].stack).toBe('RandomCustomError: bar');
});

it('throws when the child process returns a strange message', () => {
  const worker = new Worker({
    workerPath: '/tmp/foo',
  });

  worker.send([CHILD_MESSAGE_CALL, false, 'method', []], () => {});

  // Type 27 does not exist.
  expect(() => {
    forkInterface.emit('message', [27]);
  }).toThrow(TypeError);
});

it('does not restart the child if it cleanly exited', () => {
  new Worker({
    workerPath: '/tmp/foo',
  });

  expect(childProcess.fork.mock.calls.length).toBe(1);
  forkInterface.emit('exit', 0);
  expect(childProcess.fork.mock.calls.length).toBe(1);
});

it('restarts the child when the child process dies', () => {
  new Worker({
    workerPath: '/tmp/foo',
  });

  expect(childProcess.fork.mock.calls.length).toBe(1);
  forkInterface.emit('exit', 1);
  expect(childProcess.fork.mock.calls.length).toBe(2);
});
