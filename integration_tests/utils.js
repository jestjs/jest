/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const {spawnSync} = require('child_process');
const fs = require('fs');
const {createDirectory} = require('jest-util');
const path = require('path');

const run = (cmd, cwd) => {
  const args = cmd.split(/\s/).slice(1);
  // "shell: true" required to spawn npm on Windows
  const spawnOptions = {cwd, shell: true};
  const result = spawnSync(cmd.split(/\s/)[0], args, spawnOptions);

  if (result.status !== 0) {
    const message = `
      ORIGINAL CMD: ${cmd}
      STDOUT: ${result.stdout && result.stdout.toString()}
      STDERR: ${result.stderr && result.stderr.toString()}
      STATUS: ${result.status}
      ERROR: ${result.error}
    `;
    throw new Error(message);
  }

  return result;
};

const linkJestPackage = (packageName, cwd) => {
  const packagesDir = path.resolve(__dirname, '../packages');
  const packagePath = path.resolve(packagesDir, packageName);
  const destination = path.resolve(cwd, 'node_modules/');
  const destinationPackage = path.join(destination, packageName);
  createDirectory(destination);

  // Remove any existing symlink
  if (fs.existsSync(destinationPackage)) {
    fs.unlinkSync(destinationPackage);
  }
  fs.symlinkSync(packagePath, destinationPackage, 'dir');
};

const fileExists = filePath => {
  try {
    fs.accessSync(filePath, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = {
  fileExists,
  linkJestPackage,
  run,
};
