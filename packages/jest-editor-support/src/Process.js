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

const {ChildProcess, spawn} =  require('child_process');
const ProjectWorkspace = require('./ProjectWorkspace');

/**
 * Spawns and returns a Jest process with specific args
 *
 * @param {string[]} args
 * @returns {ChildProcess}
 */
module.exports.createProcess = (
  workspace: ProjectWorkspace, args: Array<string>,
): ChildProcess => {

  // A command could look like `npm run test`, which we cannot use as a command
  // as they can only be the first command, so take out the command, and add
  // any other bits into the args
  const runtimeExecutable = workspace.pathToJest;
  const [command, ...initialArgs] = runtimeExecutable.split(' ');
  const runtimeArgs = [...initialArgs, ...args];

  // If a path to configuration file was defined, push it to runtimeArgs
  const configPath = workspace.pathToConfig;
  if (configPath !== '') {
    runtimeArgs.push('--config');
    runtimeArgs.push(configPath);
  }

  // To use our own commands in create-react, we need to tell the command that
  // we're in a CI environment, or it will always append --watch
  const env = process.env;
  env['CI'] = 'true';

  return spawn(command, runtimeArgs,  {cwd: workspace.rootPath, env});
};
