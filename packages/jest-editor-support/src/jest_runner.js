// @flow
'use strict';

import {ChildProcess} from 'child_process';
import {readFile} from 'fs';
import {tmpdir} from 'os';
import EventEmitter from 'events';
import {ProjectWorkspace} from './project_workspace';
import {jestChildProcessWithArgs} from './jest_process';

// This class represents the running process, and
// passes out events when it understands what data is being
// pass sent out of the process

export class JestRunner extends EventEmitter {
  debugprocess: ChildProcess;
  workspace: ProjectWorkspace;
    
  constructor(workspace: ProjectWorkspace) {
    super();
    this.workspace = workspace;
  }

  start() {
    const tempJSON = tmpdir() + '/vscode-jest_runner.json';
    const args = [
      '--json', 
      '--useStderr', 
      '--watch', 
      '--jsonOutputFile', 
      tempJSON,
    ];
    this.debugprocess = jestChildProcessWithArgs(this.workspace, args);

    this.debugprocess.stdout.on('data', (data: Buffer) => {
      // Make jest save to a file, otherwise we get chunked data 
      // and it can be hard to put it back together.
      const stringValue = data.toString().replace(/\n$/, '').trim();
      if (stringValue.startsWith('Test results written to')) {
        readFile(tempJSON, 'utf8', (err, data) => {
          if (err) {
            const message = `JSON test overview file not found at ${tempJSON}`;
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
}
