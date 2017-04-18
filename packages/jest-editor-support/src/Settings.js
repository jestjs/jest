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

const {ChildProcess} = require('child_process');
const EventEmitter = require('events');
const ProjectWorkspace = require('./ProjectWorkspace');
const {createProcess} = require('./Process');

// This class represents the the configuration of Jest's process
// we want to start with the defaults then override whatever they output
// the interface below can be used to show what we use, as currently the whole
// settings object will be in memory.

// Ideally anything you care about adding should have a default in
// the constructor see https://facebook.github.io/jest/docs/configuration.html
// for full deets

// For now, this is all we care about inside the config

type Glob = string;

type ConfigRepresentation = {
  testRegex: string,
  testMatch: Array<Glob>,
};
import type {Options} from './types';

module.exports = class Settings extends EventEmitter {
  debugprocess: ChildProcess;
  jestVersionMajor: number | null;
  _createProcess: (
    workspace: ProjectWorkspace,
    args: Array<string>,
  ) => ChildProcess;
  settings: ConfigRepresentation;
  workspace: ProjectWorkspace;

  constructor(workspace: ProjectWorkspace, options?: Options) {
    super();
    this.workspace = workspace;
    this._createProcess = (options && options.createProcess) || createProcess;

    // Defaults for a Jest project
    this.settings = {
      testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)(spec|test).js?(x)'],
      testRegex: '(/__tests__/.*|\\.(test|spec))\\.jsx?$',
    };
  }

  getConfig(completed: any) {
    this.debugprocess = this._createProcess(this.workspace, ['--showConfig']);

    this.debugprocess.stdout.on('data', (data: Buffer) => {
      const {config, version} = JSON.parse(data.toString());
      // We can give warnings to versions under 17 now
      // See https://github.com/facebook/jest/issues/2343 for moving this into
      // the config object

      this.jestVersionMajor = parseInt(version.split('.').shift(), 10);
      this.settings = config;

      completed();
    });
  }
};
