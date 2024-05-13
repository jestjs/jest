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

/**
 * Disable any configuration settings that might change Sapling's default output.
 * More info in `sl help environment`.  _HG_PLAIN is intentional
 */
const env = {...process.env, HGPLAIN: '1'};

// Whether `sl` is a steam locomotive or not
let isSteamLocomotive = false;

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

    const result = await execa('sl', args, {cwd, env});

    return result.stdout
      .split('\n')
      .filter(s => s !== '')
      .map(changedPath => path.resolve(cwd, changedPath));
  },

  getRoot: async cwd => {
    if (isSteamLocomotive) {
      return null;
    }

    try {
      const subprocess = execa('sl', ['root'], {cwd, env});

      // Check if we're calling sl (steam locomotive) instead of sl (sapling)
      // by looking for the escape character in the first chunk of data.
      if (subprocess.stdout) {
        subprocess.stdout.once('data', (data: Buffer | string) => {
          data = Buffer.isBuffer(data) ? data.toString() : data;
          if (data.codePointAt(0) === 27) {
            subprocess.cancel();
            isSteamLocomotive = true;
          }
        });
      }

      const result = await subprocess;
      if (result.killed && isSteamLocomotive) {
        return null;
      }

      return result.stdout;
    } catch {
      return null;
    }
  },
};

export default adapter;
