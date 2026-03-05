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

const env = {...process.env, HGPLAIN: '1'};

const adapter: SCMAdapter = {
  findChangedFiles: async (cwd, options) => {
    const includePaths = options.includePaths ?? [];

    const args = ['status', '-amnu'];
    if (options.withAncestor === true) {
      args.push('--rev', 'first(min(!public() & ::.)^+.^)');
    } else if (
      options.changedSince != null &&
      options.changedSince.length > 0
    ) {
      args.push('--rev', `ancestor(., ${options.changedSince})`);
    } else if (options.lastCommit === true) {
      args.push('--change', '.');
    }
    args.push(...includePaths);

    const result = await execFile('hg', args, {
      cwd,
      env,
      maxBuffer: MAX_BUFFER,
    });

    return result.stdout
      .trimEnd()
      .split('\n')
      .filter(s => s !== '')
      .map(changedPath => path.resolve(cwd, changedPath));
  },

  getRoot: async cwd => {
    try {
      const result = await execFile('hg', ['root'], {
        cwd,
        env,
        maxBuffer: MAX_BUFFER,
      });

      return result.stdout.trimEnd();
    } catch {
      return null;
    }
  },
};

export default adapter;
