/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import execa = require('execa');
import type {Config} from '@jest/types';

import type {SCMAdapter} from './types';

const findChangedFilesUsingCommand = async (
  args: Array<string>,
  cwd: Config.Path,
): Promise<Array<Config.Path>> => {
  let result: execa.ExecaReturnValue;

  try {
    result = await execa('git', args, {cwd});
  } catch (e) {
    // TODO: Should we keep the original `message`?
    e.message = e.stderr;

    throw e;
  }

  return result.stdout
    .split('\n')
    .filter(s => s !== '')
    .map(changedPath => path.resolve(cwd, changedPath));
};

const adapter: SCMAdapter = {
  findChangedFiles: async (cwd, options) => {
    const changedSince: string | undefined =
      options && (options.withAncestor ? 'HEAD^' : options.changedSince);

    const includePaths: Array<Config.Path> = (
      (options && options.includePaths) ||
      []
    ).map(absoluteRoot => path.normalize(path.relative(cwd, absoluteRoot)));

    if (options && options.lastCommit) {
      return findChangedFilesUsingCommand(
        ['show', '--name-only', '--pretty=format:', 'HEAD'].concat(
          includePaths,
        ),
        cwd,
      );
    }
    if (changedSince) {
      const [committed, staged, unstaged] = await Promise.all([
        findChangedFilesUsingCommand(
          ['diff', '--name-only', `${changedSince}...HEAD`].concat(
            includePaths,
          ),
          cwd,
        ),
        findChangedFilesUsingCommand(
          ['diff', '--cached', '--name-only'].concat(includePaths),
          cwd,
        ),
        findChangedFilesUsingCommand(
          ['ls-files', '--other', '--modified', '--exclude-standard'].concat(
            includePaths,
          ),
          cwd,
        ),
      ]);
      return [...committed, ...staged, ...unstaged];
    }
    const [staged, unstaged] = await Promise.all([
      findChangedFilesUsingCommand(
        ['diff', '--cached', '--name-only'].concat(includePaths),
        cwd,
      ),
      findChangedFilesUsingCommand(
        ['ls-files', '--other', '--modified', '--exclude-standard'].concat(
          includePaths,
        ),
        cwd,
      ),
    ]);
    return [...staged, ...unstaged];
  },

  getRoot: async cwd => {
    const options = ['rev-parse', '--show-cdup'];

    try {
      const result = await execa('git', options, {cwd});

      return path.resolve(cwd, result.stdout);
    } catch {
      return null;
    }
  },
};

export default adapter;
