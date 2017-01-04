/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {EventEmitter} = require('events');
const path = require('path');
const fixtures = path.resolve(__dirname, 'fixtures');
const ProjectWorkspace = require('../ProjectWorkspace');

const {readFileSync} = require('fs');

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
let mockDebugProcess =  {};
const mockJestChildProcessWithArgs = jest.fn(() => mockDebugProcess);
jest.mock('../Process.js', () => {
  return {
    jestChildProcessWithArgs: mockJestChildProcessWithArgs,
  };
});

const Runner = require('../Runner');

describe('events', () => {
  let runner;
  let fakeProcess;

  beforeEach(() => {
    mockJestChildProcessWithArgs.mockClear();
    const workspace = new ProjectWorkspace('.', 'node_modules/.bin/jest', 18);
    runner = new Runner(workspace);
    fakeProcess = new EventEmitter();
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
    const storedJSON = JSON.parse(dataAtPath);
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
    expect(mockJestChildProcessWithArgs).toHaveBeenCalledTimes(1);
  });

  it('should start jest process after killing the old process', () => {
    runner.closeProcess();
    runner.start();
    expect(mockJestChildProcessWithArgs).toHaveBeenCalledTimes(2);
  });
});
