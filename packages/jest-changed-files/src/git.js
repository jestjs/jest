/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Path} from 'types/Config';
import type {Options, SCMAdapter} from 'types/ChangedFiles';

import path from 'path';
import childProcess from 'child_process';

const adapter: SCMAdapter = {
  findChangedFiles: async (
    cwd: string,
    options?: Options,
  ): Promise<Array<Path>> => {
    if (options && options.withAncestor) {
      throw new Error(
        '`changedFilesWithAncestor` is not supported in git repos',
      );
    }
    return new Promise((resolve, reject) => {
      const args =
        options && options.lastCommit
          ? ['show', '--name-only', '--pretty=%b', 'HEAD']
          : ['ls-files', '--other', '--modified', '--exclude-standard'];
      const child = childProcess.spawn('git', args, {cwd});
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', data => (stdout += data));
      child.stderr.on('data', data => (stderr += data));
      child.on('error', e => reject(e));
      child.on('close', code => {
        if (code === 0) {
          stdout = stdout.trim();
          if (stdout === '') {
            resolve([]);
          } else {
            resolve(
              stdout
                .split('\n')
                .map(changedPath => path.resolve(cwd, changedPath)),
            );
          }
        } else {
          reject(code + ': ' + stderr);
        }
      });
    });
  },

  getRoot: async (cwd: string): Promise<?string> => {
    return new Promise(resolve => {
      try {
        let stdout = '';
        const options = ['rev-parse', '--show-toplevel'];
        const child = childProcess.spawn('git', options, {cwd});
        child.stdout.on('data', data => (stdout += data));
        child.on('error', () => resolve(null));
        child.on('close', code => resolve(code === 0 ? stdout.trim() : null));
      } catch (e) {
        resolve(null);
      }
    });
  },
};

module.exports = adapter;
