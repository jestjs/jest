/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {ChildProcess, spawn} from 'child_process';

import ProjectWorkspace from './project_workspace';

/**
 * Spawns and returns a Jest process with specific args
 *
 * @param {string[]} args
 * @returns {ChildProcess}
 */
export const createProcess = (
  workspace: ProjectWorkspace,
  args: Array<string>,
  debugPort?: number,
): ChildProcess => {
  // A command could look like `npm run test`, which we cannot use as a command
  // as they can only be the first command, so take out the command, and add
  // any other bits into the args
  const runtimeExecutable = workspace.pathToJest;
  const parameters = runtimeExecutable.split(' ');
  let command = parameters[0];
  const initialArgs = parameters.slice(1);
  const runtimeArgs = [].concat(initialArgs, args);

  // prepare process for debugging
  if (typeof debugPort === 'number') {
    if (command.endsWith('jest.js')) {
      runtimeArgs.unshift('--debug=' + debugPort, command);
      command = 'node';
    } else {
      // debug is enabled by adding --debug-brk as first argumemt of node
      // eg: `node --debug=123 node_modules/jest-cli/bin/jest.js [...args]`
      // and thersefore `pathToJest` must point to javascript
      throw new Error(
        'To enable debugging specify path to jest.js in pathToJest.',
      );
    }
  }

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

  return spawn(command, runtimeArgs, {cwd: workspace.rootPath, env});
};
