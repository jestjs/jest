/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Options, MessageType, SpawnOptions} from './types';
import {messageTypes} from './types';

import {ChildProcess, spawn} from 'child_process';
import {readFile} from 'fs';
import {tmpdir} from 'os';
import EventEmitter from 'events';
import ProjectWorkspace from './project_workspace';
import {createProcess} from './Process';

// This class represents the running process, and
// passes out events when it understands what data is being
// pass sent out of the process
export default class Runner extends EventEmitter {
  debugprocess: ChildProcess;
  outputPath: string;
  workspace: ProjectWorkspace;
  _createProcess: (
    workspace: ProjectWorkspace,
    args: Array<string>,
    options?: SpawnOptions,
  ) => ChildProcess;
  watchMode: boolean;
  watchAll: boolean;
  options: Options;
  prevMessageTypes: MessageType[];

  constructor(workspace: ProjectWorkspace, options?: Options) {
    super();

    this._createProcess = (options && options.createProcess) || createProcess;
    this.options = options || {};
    this.workspace = workspace;
    this.outputPath = tmpdir() + '/jest_runner.json';
    this.prevMessageTypes = [];
  }

  start(watchMode: boolean = true, watchAll: boolean = false) {
    if (this.debugprocess) {
      return;
    }

    this.watchMode = watchMode;
    this.watchAll = watchAll;

    // Handle the arg change on v18
    const belowEighteen = this.workspace.localJestMajorVersion < 18;
    const outputArg = belowEighteen ? '--jsonOutputFile' : '--outputFile';

    const args = ['--json', '--useStderr', outputArg, this.outputPath];
    if (this.watchMode) {
      args.push(this.watchAll ? '--watchAll' : '--watch');
    }
    if (this.options.testNamePattern) {
      args.push('--testNamePattern', this.options.testNamePattern);
    }
    if (this.options.testFileNamePattern) {
      args.push(this.options.testFileNamePattern);
    }

    const options = {
      shell: this.options.shell,
    };

    this.debugprocess = this._createProcess(this.workspace, args, options);
    this.debugprocess.stdout.on('data', (data: Buffer) => {
      // Make jest save to a file, otherwise we get chunked data
      // and it can be hard to put it back together.
      const stringValue = data.toString().trim();

      if (stringValue.startsWith('Test results written to')) {
        readFile(this.outputPath, 'utf8', (err, data) => {
          if (err) {
            const message = `JSON report not found at ${this.outputPath}`;
            this.emit('terminalError', message);
          } else {
            const noTestsFound = this.doResultsFollowNoTestsFoundMessage();
            this.emit('executableJSON', JSON.parse(data), {noTestsFound});
          }
        });
      } else {
        this.emit('executableOutput', stringValue.replace('[2J[H', ''));
      }
      this.prevMessageTypes.length = 0;
    });

    this.debugprocess.stderr.on('data', (data: Buffer) => {
      const type = this.findMessageType(data);
      if (type === messageTypes.unknown) {
        this.prevMessageTypes.length = 0;
      } else {
        this.prevMessageTypes.push(type);
      }

      this.emit('executableStdErr', data, {type});
    });

    this.debugprocess.on('exit', () => {
      this.emit('debuggerProcessExit');
      this.prevMessageTypes.length = 0;
    });

    this.debugprocess.on('error', (error: Error) => {
      this.emit('terminalError', 'Process failed: ' + error.message);
      this.prevMessageTypes.length = 0;
    });

    this.debugprocess.on('close', () => {
      this.emit('debuggerProcessExit');
      this.prevMessageTypes.length = 0;
    });
  }

  runJestWithUpdateForSnapshots(completion: any, args: string[]) {
    const defaultArgs = ['--updateSnapshot'];

    const options = {shell: this.options.shell};
    const updateProcess = this._createProcess(
      this.workspace,
      [...defaultArgs, ...(args ? args : [])],
      options,
    );
    updateProcess.on('close', () => {
      completion();
    });
  }

  closeProcess() {
    if (!this.debugprocess) {
      return;
    }
    if (process.platform === 'win32') {
      // Windows doesn't exit the process when it should.
      spawn('taskkill', ['/pid', '' + this.debugprocess.pid, '/T', '/F']);
    } else {
      this.debugprocess.kill();
    }
    delete this.debugprocess;
  }

  findMessageType(buf: Buffer) {
    const str = buf.toString('utf8', 0, 58);
    if (str === 'No tests found related to files changed since last commit.') {
      return messageTypes.noTests;
    }

    if (/^\s*Watch Usage\b/.test(str)) {
      return messageTypes.watchUsage;
    }

    return messageTypes.unknown;
  }

  doResultsFollowNoTestsFoundMessage() {
    if (this.prevMessageTypes.length === 1) {
      return this.prevMessageTypes[0] === messageTypes.noTests;
    }

    if (this.prevMessageTypes.length === 2) {
      return (
        this.prevMessageTypes[0] === messageTypes.noTests &&
        this.prevMessageTypes[1] === messageTypes.watchUsage
      );
    }

    return false;
  }
}
