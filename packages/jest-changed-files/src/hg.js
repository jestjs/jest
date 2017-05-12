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

const path = require('path');
const childProcess = require('child_process');

const env = Object.assign({}, process.env, {
  HGPLAIN: 1,
});

type Options = {|
  lastCommit?: boolean,
  withAncestor?: boolean,
|};

function findChangedFiles(cwd: string, options: Options): Promise<Array<Path>> {
  return new Promise((resolve, reject) => {
    let args = ['status', '-amn'];
    if (options && options.withAncestor) {
      args.push('--rev', 'ancestor(.^)');
    } else if (options && options.lastCommit === true) {
      args = ['tip', '--template', '{files%"{file}\n"}'];
    }
    const child = childProcess.spawn('hg', args, {cwd, env});
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
}

function isHGRepository(cwd: string): Promise<?string> {
  return new Promise(resolve => {
    try {
      let stdout = '';
      const child = childProcess.spawn('hg', ['root'], {cwd, env});
      child.stdout.on('data', data => (stdout += data));
      child.on('error', () => resolve(null));
      child.on('close', code => resolve(code === 0 ? stdout.trim() : null));
    } catch (e) {
      resolve(null);
    }
  });
}

module.exports = {
  findChangedFiles,
  isHGRepository,
};
