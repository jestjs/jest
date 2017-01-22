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
const {EOL} = require('os');
const ProjectWorkspace = require('./ProjectWorkspace');
const {jestChildProcessWithArgs} = require('./Process');

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
  testGlob: Array<Glob>
}

module.exports = class Settings extends EventEmitter {
  debugprocess: ChildProcess;
  workspace: ProjectWorkspace;

  settings: ConfigRepresentation;
  jestVersionMajor: number | null;

  constructor(workspace: ProjectWorkspace) {
    super();
    this.workspace = workspace;

    // Defaults for a Jest project
    this.settings = {
      testGlob: [
        '**/__tests__/**/*.js?(x)',
        '**/?(*.)(spec|test).js?(x)',
      ],
    };
  }

  getConfig(completed: any) {
    // It'll want to run tests, we don't want that, so tell it to run tests
    // in a non-existant folder.
    const folderThatDoesntExist = 'hi-there-danger-are-you-following-along';
    const args = ['--debug', folderThatDoesntExist];
    this.debugprocess = jestChildProcessWithArgs(this.workspace, args);

    this.debugprocess.stdout.on('data', (data: Buffer) => {
      const string = data.toString();
      // We can give warnings to versions under 17 now
      // See https://github.com/facebook/jest/issues/2343 for moving this into 
      // the config object
      if (string.includes('jest version =')) {
        const version = string.split('jest version =')
          .pop()
          .split(EOL)[0]
          .trim();
        this.jestVersionMajor = parseInt(version, 10);
      }

      // Pull out the data for the config
      if (string.includes('config =')) {
        const jsonString = string.split('config =')
          .pop()
          .split('No tests found')[0];
        this.settings = JSON.parse(jsonString);
        completed();
      }
    });
  }
};
