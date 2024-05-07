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

    const result = await execa('hg', args, {cwd, env});

    return result.stdout
      .split('\n')
      .filter(s => s !== '')
      .map(changedPath => path.resolve(cwd, changedPath));
  },

  getRoot: async cwd => {
    try {
      const result = await execa('hg', ['root'], {cwd, env});

      return result.stdout;
    } catch {
      return null;
    }
  },
};

export default adapter;
