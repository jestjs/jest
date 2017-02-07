/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const {ChildProcess, spawn} = require('child_process');
const {readFile} = require('fs');
const {tmpdir} = require('os');
const {EventEmitter} = require('events');
const ProjectWorkspace = require('./ProjectWorkspace');
const {jestChildProcessWithArgs} = require('./Process');

import type {Options} from './types';
// This class represents the running process, and
// passes out events when it understands what data is being
// pass sent out of the process
module.exports = class Runner extends EventEmitter {
  debugprocess: ChildProcess;
  options: Options;
  outputPath: string;
  workspace: ProjectWorkspace;

  constructor(workspace: ProjectWorkspace, options?: Options) {
    super();
    this.options = options || {
      createProcess: jestChildProcessWithArgs,
    };
    this.workspace = workspace;
    this.outputPath = tmpdir() + '/jest_runner.json';
  }

  start() {
    if (this.debugprocess) {
      return;
    }
    // Handle the arg change on v18
    const belowEighteen = this.workspace.localJestMajorVersion < 18;
    const outputArg = belowEighteen ? '--jsonOutputFile' : '--outputFile';

    const args = [
      '--json',
      '--useStderr',
      '--watch',
      outputArg,
      this.outputPath,
    ];

    this.debugprocess = this.options.createProcess(this.workspace, args);
    this.debugprocess.stdout.on('data', (data: Buffer) => {
      // Make jest save to a file, otherwise we get chunked data
      // and it can be hard to put it back together.
      const stringValue = data.toString().replace(/\n$/, '').trim();
      if (stringValue.startsWith('Test results written to')) {
        readFile(this.outputPath, 'utf8', (err, data) => {
          if (err) {
            const message = `JSON report not found at ${this.outputPath}`;
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
    const updateProcess = this.options.createProcess(this.workspace, args);
    updateProcess.on('close', () => {
      completion();
    });
  }

  closeProcess() {
    if (process.platform === 'win32') {
      // Windows doesn't exit the process when it should.
      spawn('taskkill', ['/pid', '' + this.debugprocess.pid, '/T', '/F']);
    } else {
      this.debugprocess.kill();
    }
    delete this.debugprocess;
  }
};
