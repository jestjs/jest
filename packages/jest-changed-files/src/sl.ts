/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execFile as execFileCb, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import * as path from 'path';
import type {SCMAdapter} from './types';

const execFile = promisify(execFileCb);

const MAX_BUFFER = 100 * 1024 * 1024;

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

    const result = await execFile('sl', args, {
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
    if (isSteamLocomotive) {
      return null;
    }

    try {
      const result = await new Promise<{killed: boolean; stdout: string}>(
        (resolve, reject) => {
          const subprocess = spawn('sl', ['root'], {cwd, env});
          let firstChunk = true;
          let stdout = '';

          subprocess.stdout.on('data', (data: Buffer) => {
            const str = data.toString();

            // Check if we're calling sl (steam locomotive) instead of
            // sl (sapling) by looking for the escape character in the
            // first chunk of data.
            if (firstChunk) {
              firstChunk = false;
              if (str.codePointAt(0) === 27) {
                subprocess.kill();
                isSteamLocomotive = true;
              }
            }

            stdout += str;
          });

          subprocess.on('close', code => {
            if (code !== 0 && !subprocess.killed) {
              reject(new Error(`Process sl exited with code ${code}`));
            } else {
              resolve({killed: subprocess.killed, stdout: stdout.trimEnd()});
            }
          });

          subprocess.on('error', reject);
        },
      );

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
