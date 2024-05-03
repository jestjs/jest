/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import {types} from 'util';
import execa = require('execa');
import type {SCMAdapter} from './types';

/**
 * Disable any configuration settings that might change Sapling's default output.
 * More info in `sl help environment`.  _HG_PLAIN is intentional
 */
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

    let result: execa.ExecaReturnValue;

    try {
      result = await execa('sl', args, {cwd, env});
    } catch (error) {
      if (types.isNativeError(error)) {
        const err = error as execa.ExecaError;
        // TODO: Should we keep the original `message`?
        err.message = err.stderr;
      }

      throw error;
    }

    return result.stdout
      .split('\n')
      .filter(s => s !== '')
      .map(changedPath => path.resolve(cwd, changedPath));
  },

  getRoot: async cwd => {
    try {
      const subprocess = execa('sl', ['root'], {cwd, env});
      if (subprocess.stdout == null) {
        return null;
      }

      // Check if we're calling sl (steam locomotive) instead of sl (sapling)
      // by looking for the escape character in the first chunk of data.
      let firstChunk = true;
      subprocess.stdout.on('data', data => {
        if (!firstChunk) {
          return;
        }
        if (data.toString().codePointAt(0) === 27) {
          subprocess.cancel();
        }
        firstChunk = false;
      });

      const result = await subprocess;
      if (result.killed) {
        return null;
      }

      return result.stdout;
    } catch {
      return null;
    }
  },
};

export default adapter;
