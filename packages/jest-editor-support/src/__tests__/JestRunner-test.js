'use strict';

const {EventEmitter} = require('events');
const path = require('path');
const fixtures = path.resolve(__dirname, 'fixtures');

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
jest.mock('../JestProcess.js', () => {
  return { 
    jestChildProcessWithArgs: () => mockDebugProcess, 
  };
});

const JestRunner = require('../JestRunner');

describe('events', () => {
  let runner;
  let fakeProcess;

  beforeEach(() => {
    runner = new JestRunner();
    fakeProcess = new EventEmitter();
    fakeProcess.stdout = new EventEmitter();
    fakeProcess.stderr = new EventEmitter();
    mockDebugProcess = fakeProcess; 
    
    // Sets it up and registers for notifications
    runner.start();
  });

  it('expects JSON from stdout, then it passes the JSON', () => {
    const data = jest.fn();
    runner.on('executableJSON', data);
    
    runner.jsonFilePath = `${fixtures}/failing_jsons/failing_jest_json.json`;

    // Emitting data through stdout should trigger sending JSON 
    fakeProcess.stdout.emit('data', 'Test results written to file'); 
    expect(data).toBeCalled();

    // And lets check what we emit
    const dataAtPath = readFileSync(runner.jsonFilePath);
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
});
