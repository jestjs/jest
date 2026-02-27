/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execFile as execFileCb} from 'node:child_process';
import {promisify} from 'node:util';
import * as path from 'path';
import type {SCMAdapter} from './types';

const execFile = promisify(execFileCb);

const MAX_BUFFER = 100 * 1024 * 1024;

const findChangedFilesUsingCommand = async (
  args: Array<string>,
  cwd: string,
): Promise<Array<string>> => {
  const result = await execFile('git', args, {cwd, maxBuffer: MAX_BUFFER});

  return result.stdout
    .trimEnd()
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
      const result = await execFile('git', options, {
        cwd,
        maxBuffer: MAX_BUFFER,
      });

      return path.resolve(cwd, result.stdout.trimEnd());
    } catch {
      return null;
    }
  },
};

export default adapter;
