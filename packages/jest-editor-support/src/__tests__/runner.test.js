/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const {EventEmitter} = require('events');
const path = require('path');
const {readFileSync} = require('fs');
const fixtures = path.resolve(__dirname, '../../../../fixtures');
import ProjectWorkspace from '../project_workspace';
import {messageTypes} from '../types';

// Replace `readFile` with `readFileSync` so we don't get multiple threads
jest.doMock('fs', () => {
  return {
    readFile: (path, type, closure) => {
      const data = readFileSync(path);
      closure(null, data);
    },
    readFileSync,
  };
});

// Let's us use a per-test "jest process"
let mockDebugProcess = {};
const mockCreateProcess = jest.fn(() => mockDebugProcess);
jest.doMock('../Process.js', () => {
  return {
    createProcess: mockCreateProcess,
  };
});

const Runner = require('../Runner').default;

describe('events', () => {
  let runner;
  let fakeProcess;

  beforeEach(() => {
    mockCreateProcess.mockClear();
    const workspace = new ProjectWorkspace(
      '.',
      'node_modules/.bin/jest',
      'test',
      18,
    );
    runner = new Runner(workspace);
    fakeProcess = (new EventEmitter(): any);
    fakeProcess.stdout = new EventEmitter();
    fakeProcess.stderr = new EventEmitter();
    mockDebugProcess = fakeProcess;
    mockDebugProcess.kill = jest.fn();

    // Sets it up and registers for notifications
    runner.start();
  });

  it('expects JSON from stdout, then it passes the JSON', () => {
    const data = jest.fn();
    runner.on('executableJSON', data);

    runner.outputPath = `${fixtures}/failing_jsons/failing_jest_json.json`;

    // Emitting data through stdout should trigger sending JSON
    fakeProcess.stdout.emit('data', 'Test results written to file');
    expect(data).toBeCalled();

    // And lets check what we emit
    const dataAtPath = readFileSync(runner.outputPath);
    const storedJSON = JSON.parse(dataAtPath.toString());
    expect(data.mock.calls[0][0]).toEqual(storedJSON);
  });

  it('emits errors when process errors', () => {
    const error = jest.fn();
    runner.on('terminalError', error);
    fakeProcess.emit('error', {});
    expect(error).toBeCalled();
  });

  it('emits debuggerProcessExit when process exits', () => {
    const close = jest.fn();
    runner.on('debuggerProcessExit', close);
    fakeProcess.emit('exit');
    expect(close).toBeCalled();
  });

  it('should only start one jest process at a time', () => {
    runner.start();
    expect(mockCreateProcess).toHaveBeenCalledTimes(1);
  });

  it('should start jest process after killing the old process', () => {
    runner.closeProcess();
    runner.start();
    expect(mockCreateProcess).toHaveBeenCalledTimes(2);
  });

  describe('stdout.on("data")', () => {
    it('should emit an "executableJSON" event with the "noTestsFound" meta data property set', () => {
      const listener = jest.fn();
      runner.on('executableJSON', listener);
      runner.outputPath = `${fixtures}/failing_jsons/failing_jest_json.json`;
      (runner: any).doResultsFollowNoTestsFoundMessage = jest
        .fn()
        .mockReturnValueOnce(true);
      fakeProcess.stdout.emit('data', 'Test results written to file');

      expect(listener.mock.calls[0].length).toBe(2);
      expect(listener.mock.calls[0][1]).toEqual({noTestsFound: true});
    });

    it('should clear the message type history', () => {
      runner.outputPath = `${fixtures}/failing_jsons/failing_jest_json.json`;
      runner.prevMessageTypes.push(messageTypes.noTests);
      fakeProcess.stdout.emit('data', 'Test results written to file');

      expect(runner.prevMessageTypes.length).toBe(0);
    });
  });

  describe('stderr.on("data")', () => {
    it('should identify the message type', () => {
      (runner: any).findMessageType = jest.fn();
      const expected = {};
      fakeProcess.stderr.emit('data', expected);

      expect(runner.findMessageType).toBeCalledWith(expected);
    });

    it('should add the type to the message type history when known', () => {
      (runner: any).findMessageType = jest
        .fn()
        .mockReturnValueOnce(messageTypes.noTests);
      fakeProcess.stderr.emit('data', Buffer.from(''));

      expect(runner.prevMessageTypes).toEqual([messageTypes.noTests]);
    });

    it('should clear the message type history when the type is unknown', () => {
      (runner: any).findMessageType = jest
        .fn()
        .mockReturnValueOnce(messageTypes.unknown);
      fakeProcess.stderr.emit('data', Buffer.from(''));

      expect(runner.prevMessageTypes).toEqual([]);
    });

    it('should emit an "executableStdErr" event with the type', () => {
      const listener = jest.fn();
      const data = Buffer.from('');
      const type = {};
      const meta = {type};
      (runner: any).findMessageType = jest.fn().mockReturnValueOnce(type);

      runner.on('executableStdErr', listener);
      fakeProcess.stderr.emit('data', data, meta);

      expect(listener).toBeCalledWith(data, meta);
    });

    it('should track when "No tests found related to files changed since the last commit" is received', () => {
      const data = Buffer.from(
        'No tests found related to files changed since last commit.\n' +
          'Press `a` to run all tests, or run Jest with `--watchAll`.',
      );
      fakeProcess.stderr.emit('data', data);

      expect(runner.prevMessageTypes).toEqual([messageTypes.noTests]);
    });

    it('should clear the message type history when any other other data is received', () => {
      const data = Buffer.from('');
      fakeProcess.stderr.emit('data', data);

      expect(runner.prevMessageTypes).toEqual([]);
    });
  });

  describe('findMessageType()', () => {
    it('should return "unknown" when the message is not matched', () => {
      const buf = Buffer.from('');
      expect(runner.findMessageType(buf)).toBe(messageTypes.unknown);
    });

    it('should identify "No tests found related to files changed since last commit."', () => {
      const buf = Buffer.from(
        'No tests found related to files changed since last commit.\n' +
          'Press `a` to run all tests, or run Jest with `--watchAll`.',
      );
      expect(runner.findMessageType(buf)).toBe(messageTypes.noTests);
    });

    it('should identify the "Watch Usage" prompt', () => {
      const buf = Buffer.from('\n\nWatch Usage\n...');
      expect(runner.findMessageType(buf)).toBe(messageTypes.watchUsage);
    });
  });

  describe('doResultsFollowNoTestsFoundMessage()', () => {
    it('should return true when the last message on stderr was "No tests found..."', () => {
      runner.prevMessageTypes.push(messageTypes.noTests);
      expect(runner.doResultsFollowNoTestsFoundMessage()).toBe(true);
    });

    it('should return true when the last two messages on stderr were "No tests found..." and "Watch Usage"', () => {
      runner.prevMessageTypes.push(
        messageTypes.noTests,
        messageTypes.watchUsage,
      );
      expect(runner.doResultsFollowNoTestsFoundMessage()).toBe(true);
    });

    it('should return false otherwise', () => {
      runner.prevMessageTypes.length = 0;
      expect(runner.doResultsFollowNoTestsFoundMessage()).toBe(false);
    });
  });
});
