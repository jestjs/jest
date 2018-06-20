/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Path} from 'types/Config';
import type {Options, SCMAdapter} from 'types/ChangedFiles';

import path from 'path';
import childProcess from 'child_process';

const env = Object.assign({}, process.env, {
  HGPLAIN: 1,
});

const ANCESTORS = [
  // Parent commit to this one.
  '.^',

  // The first commit of my branch, only if we are not on the default branch.
  'min(branch(.)) and not min(branch(default))',

  // Latest public commit.
  'max(public())',
];

const adapter: SCMAdapter = {
  findChangedFiles: async (
    cwd: string,
    options: Options,
  ): Promise<Array<Path>> =>
    new Promise((resolve, reject) => {
      let args = ['status', '-amnu'];
      if (options && options.withAncestor) {
        args.push('--rev', `ancestor(${ANCESTORS.join(', ')})`);
      } else if (options && options.changedSince) {
        args.push('--rev', `ancestor(., ${options.changedSince})`);
      } else if (options && options.lastCommit === true) {
        args = ['tip', '--template', '{files%"{file}\n"}'];
      }
      const child = childProcess.spawn('hg', args, {cwd, env});
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', data => (stdout += data));
      child.stderr.on('data', data => (stderr += data));
      child.on('error', (error: Error) => reject(error));
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
          reject(new Error(code + ': ' + stderr));
        }
      });
    }),

  getRoot: async (cwd: Path): Promise<?Path> =>
    new Promise(resolve => {
      try {
        let stdout = '';
        const child = childProcess.spawn('hg', ['root'], {cwd, env});
        child.stdout.on('data', data => (stdout += data));
        child.on('error', () => resolve(null));
        child.on('close', code => resolve(code === 0 ? stdout.trim() : null));
      } catch (e) {
        resolve(null);
      }
    }),
};

export default adapter;
