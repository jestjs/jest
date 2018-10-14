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
import {windowsToWslSync} from 'wsl-path';
import type {SpawnOptions} from './types';

/**
 * Spawns and returns a Jest process with specific args
 *
 * @param {string[]} args
 * @returns {ChildProcess}
 */
export const createProcess = (
  workspace: ProjectWorkspace,
  args: Array<string>,
  options?: SpawnOptions = {},
): ChildProcess => {
  // A command could look like `npm run test`, which we cannot use as a command
  // as they can only be the first command, so take out the command, and add
  // any other bits into the args
  const runtimeExecutable = workspace.pathToJest;
  const parameters = runtimeExecutable.split(' ');
  const initialArgs = parameters.slice(1);
  let command = parameters[0];
  let runtimeArgs = [].concat(initialArgs, args);

  // If a path to configuration file was defined, push it to runtimeArgs
  if (workspace.pathToConfig) {
    runtimeArgs.push('--config');
    runtimeArgs.push(workspace.pathToConfig);
  }

  if (workspace.useWsl) {
    // useWsl can be either true for the default ('wsl' or the explicit
    // wsl call to use, e.g. 'ubuntu run')
    const wslCommand = workspace.useWsl === true ? 'wsl' : workspace.useWsl;
    runtimeArgs = [command, ...runtimeArgs].map(path =>
      convertWslPath(path, wslCommand),
    );
    command = wslCommand;
  }

  // To use our own commands in create-react, we need to tell the command that
  // we're in a CI environment, or it will always append --watch
  const env = process.env;
  env['CI'] = 'true';

  const spawnOptions = {
    cwd: workspace.rootPath,
    env,
    shell: options.shell,
  };

  if (workspace.debug) {
    console.log(
      `spawning process with command=${command}, args=${runtimeArgs.toString()}`,
    );
  }

  return spawn(command, runtimeArgs, spawnOptions);
};

const convertWslPath = (maybePath: string, wslCommand?: string): string => {
  if (!/^\w:\\/.test(maybePath)) {
    return maybePath;
  }
  // not every string containing a windows delimiter needs to be a
  // path, but if it starts with C:\ or similar the chances are very high
  try {
    return windowsToWslSync(maybePath, {wslCommand});
  } catch (exception) {
    console.log(
      `Tried to translate ${maybePath} but received exception`,
      exception,
    );
    return maybePath;
  }
};
