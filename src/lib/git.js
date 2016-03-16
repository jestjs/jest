/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const childProcess = require('child_process');

function findChangedFiles(cwd) {
  return new Promise((resolve, reject) => {
    const args = ['diff', '--name-only', '--diff-filter=ACMR', '--relative'];
    const child = childProcess.spawn('git', args, {cwd});

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);
    child.on('close', code => {
      if (code === 0) {
        stdout = stdout.trim();
        if (stdout === '') {
          resolve([]);
        } else {
          resolve(stdout.split('\n').map(
            changedPath => path.resolve(cwd, changedPath)
          ));
        }
      } else {
        reject(code + ': ' + stderr);
      }
    });
  });
}

function isGitRepository(cwd) {
  return new Promise(resolve => {
    let stdout = '';
    const child = childProcess.spawn('git', ['rev-parse', '--git-dir'], {cwd});
    child.stdout.on('data', data => stdout += data);
    child.on('close',
      code =>  resolve(code === 0 ? path.dirname(stdout.trim()) : null)
    );
  });
}

exports.isGitRepository = isGitRepository;
exports.findChangedFiles = findChangedFiles;
