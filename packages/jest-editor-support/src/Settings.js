/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Options, SpawnOptions} from './types';

import {ChildProcess} from 'child_process';
import EventEmitter from 'events';
import ProjectWorkspace from './project_workspace';
import {createProcess} from './Process';

// This class represents the the configuration of Jest's process
// we want to start with the defaults then override whatever they output
// the interface below can be used to show what we use, as currently the whole
// settings object will be in memory.

// Ideally anything you care about adding should have a default in
// the constructor see https://jestjs.io/docs/configuration.html
// for full deets

// For now, this is all we care about inside the config

type Glob = string;

type ConfigRepresentation = {
  testRegex: string,
  testMatch: Array<Glob>,
};

type ConfigRepresentations = Array<ConfigRepresentation>;

export default class Settings extends EventEmitter {
  getConfigProcess: ChildProcess;
  jestVersionMajor: number | null;
  _createProcess: (
    workspace: ProjectWorkspace,
    args: Array<string>,
    options: SpawnOptions,
  ) => ChildProcess;
  configs: ConfigRepresentations;
  settings: ConfigRepresentation;
  workspace: ProjectWorkspace;
  spawnOptions: SpawnOptions;
  _jsonPattern: RegExp;

  constructor(workspace: ProjectWorkspace, options?: Options) {
    super();
    this.workspace = workspace;
    this._createProcess = (options && options.createProcess) || createProcess;
    this.spawnOptions = {
      shell: options && options.shell,
    };

    // Defaults for a Jest project
    this.settings = {
      testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
      testRegex: '(/__tests__/.*|\\.(test|spec))\\.jsx?$',
    };

    this.configs = [this.settings];
    this._jsonPattern = new RegExp(/^[\s]*\{/gm);
  }

  _parseConfig(text: string): void {
    let settings = null;

    try {
      settings = JSON.parse(text);
    } catch (err) {
      // skip the non-json content, if any
      const idx = text.search(this._jsonPattern);
      if (idx > 0) {
        if (this.workspace.debug) {
          console.log(`skip config output noise: ${text.substring(0, idx)}`);
        }
        this._parseConfig(text.substring(idx));
        return;
      }
      console.warn(`failed to parse config: \n${text}\nerror: ${err}`);
      throw err;
    }
    this.jestVersionMajor = parseInt(settings.version.split('.').shift(), 10);
    this.configs =
      this.jestVersionMajor >= 21 ? settings.configs : [settings.config];

    if (this.workspace.debug) {
      console.log(`found config jestVersionMajor=${this.jestVersionMajor}`);
    }
  }

  getConfigs(completed: any) {
    this.getConfigProcess = this._createProcess(
      this.workspace,
      ['--showConfig'],
      this.spawnOptions,
    );

    this.getConfigProcess.stdout.on('data', (data: Buffer) => {
      this._parseConfig(data.toString());
    });

    // They could have an older build of Jest which
    // would error with `--showConfig`
    this.getConfigProcess.on('close', () => {
      completed();
    });
  }

  getConfig(completed: any, index: number = 0) {
    this.getConfigs(() => {
      this.settings = this.configs[index];
      completed();
    });
  }
}
