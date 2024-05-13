/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import execa = require('execa');
import type {SCMAdapter} from './types';

const findChangedFilesUsingCommand = async (
  args: Array<string>,
  cwd: string,
): Promise<Array<string>> => {
  const result = await execa('git', args, {cwd});

  return result.stdout
    .split('\n')
    .filter(s => s !== '')
    .map(changedPath => path.resolve(cwd, changedPath));
};

const adapter: SCMAdapter = {
  findChangedFiles: async (cwd, options) => {
    const changedSince =
      options.withAncestor === true ? 'HEAD^' : options.changedSince;

    const includePaths = (options.includePaths ?? []).map(absoluteRoot =>
      path.normalize(path.relative(cwd, absoluteRoot)),
    );

    if (options.lastCommit === true) {
      return findChangedFilesUsingCommand(
        [
          'show',
          '--name-only',
          '--pretty=format:',
          'HEAD',
          '--',
          ...includePaths,
        ],
        cwd,
      );
    }
    if (changedSince != null && changedSince.length > 0) {
      const [committed, staged, unstaged] = await Promise.all([
        findChangedFilesUsingCommand(
          [
            'diff',
            '--name-only',
            `${changedSince}...HEAD`,
            '--',
            ...includePaths,
          ],
          cwd,
        ),
        findChangedFilesUsingCommand(
          ['diff', '--cached', '--name-only', '--', ...includePaths],
          cwd,
        ),
        findChangedFilesUsingCommand(
          [
            'ls-files',
            '--other',
            '--modified',
            '--exclude-standard',
            '--',
            ...includePaths,
          ],
          cwd,
        ),
      ]);
      return [...committed, ...staged, ...unstaged];
    }
    const [staged, unstaged] = await Promise.all([
      findChangedFilesUsingCommand(
        ['diff', '--cached', '--name-only', '--', ...includePaths],
        cwd,
      ),
      findChangedFilesUsingCommand(
        [
          'ls-files',
          '--other',
          '--modified',
          '--exclude-standard',
          '--',
          ...includePaths,
        ],
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
