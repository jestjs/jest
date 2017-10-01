/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Options} from './types';

import {ChildProcess} from 'child_process';
import EventEmitter from 'events';
import ProjectWorkspace from './project_workspace';
import {createProcess} from './Process';

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

export default class Settings extends EventEmitter {
  getConfigProcess: ChildProcess;
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

  getConfigs(completed: any) {
    this.getConfigProcess = this._createProcess(this.workspace, [
      '--showConfig',
    ]);

    this.getConfigProcess.stdout.on('data', (data: Buffer) => {
      const settings = JSON.parse(data.toString());
      this.jestVersionMajor = parseInt(settings.version.split('.').shift(), 10);
      // We can give warnings to versions under 17 now
      // See https://github.com/facebook/jest/issues/2343 for moving this into
      // the config object
      this.settings =
        this.jestVersionMajor >= 21 ? settings.configs : settings.config;
    });

    // They could have an older build of Jest which
    // would error with `--showConfig`
    this.getConfigProcess.on('close', () => {
      completed();
    });
  }

  getConfig(completed: any) {
    this.getConfigs(() => {
      if (this.jestVersionMajor >= 21) {
        this.settings = this.settings[0];
      }
      completed();
    });
  }
}
