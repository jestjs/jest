// @flow
'use strict';

const {ChildProcess} = require('child_process');
const {readFile} = require('fs');
const {tmpdir} = require('os');
const {EventEmitter} = require('events');
const ProjectWorkspace = require('./ProjectWorkspace');
const {jestChildProcessWithArgs} = require('./JestProcess');

// This class represents the running process, and
// passes out events when it understands what data is being
// pass sent out of the process

module.exports = class JestRunner extends EventEmitter {
  debugprocess: ChildProcess;
  workspace: ProjectWorkspace;
  jsonFilePath: string;

  constructor(workspace: ProjectWorkspace) {
    super();
    this.workspace = workspace;
    this.jsonFilePath = tmpdir() + '/vscode-jest_runner.json';
  }

  start() {
    const args = [
      '--json', 
      '--useStderr', 
      '--watch', 
      '--outputFile', 
      this.jsonFilePath,
    ];

    this.debugprocess = jestChildProcessWithArgs(this.workspace, args);
    this.debugprocess.stdout.on('data', (data: Buffer) => {
      // Make jest save to a file, otherwise we get chunked data 
      // and it can be hard to put it back together.
      const stringValue = data.toString().replace(/\n$/, '').trim();
      if (stringValue.startsWith('Test results written to')) {
        readFile(this.jsonFilePath, 'utf8', (err, data) => {
          if (err) {
            const message = `JSON report not found at ${this.jsonFilePath}`;
            this.emit('terminalError', message); 
          } else { 
            this.emit('executableJSON', JSON.parse(data)); 
          }
        });
      } else {
        this.emit('executableOutput', stringValue.replace('[2J[H', ''));
      }
    });

    this.debugprocess.stderr.on('data', (data: Buffer) => {
      this.emit('executableStdErr', data);
    });

    this.debugprocess.on('exit', () => {
      this.emit('debuggerProcessExit');
    });

    this.debugprocess.on('error', (error: Error) => {
      this.emit('terminalError', 'Process failed: ' + error.message);
    });

    this.debugprocess.on('close', () => {
      this.emit('debuggerProcessExit');
    });
  }

  runJestWithUpdateForSnapshots(completion: any) {
    const args = ['--updateSnapshot'];
    const updateProcess = jestChildProcessWithArgs(this.workspace, args);
    updateProcess.on('close', () => {
      completion();
    });
  }

  closeProcess() {
    this.debugprocess.kill();
  }
};
