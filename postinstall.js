/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
const path = require('path');
const fs = require('fs');

let notNPM = true;

try {
  fs.accessSync(path.resolve(__dirname, './website/package.json'));
} catch (e) {
  notNPM = false;
}

const spawnSync = require('child_process').spawnSync;

const execute = (cmd, env) => {
  const options = {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, cmd[0]),
  };

  if (env) {
    options.env = env;
  }

  spawnSync(cmd[1], cmd[2].split(' '), options);
};

if (
  notNPM &&
  process.env.NODE_ENV !== 'production'
) {
  console.log(`Setting up Jest's development environment...`);

  const cmds = [
    ['.', 'node_modules/.bin/lerna', 'bootstrap'],
    ['packages/jest-jasmine1', 'npm', 'link'],
    ['packages/jest-jasmine2', 'npm', 'link'],
    ['packages/jest-mock', 'npm', 'link'],
    ['packages/jest-util', 'npm', 'link'],
    ['.', 'npm', 'link jest-jasmine1'],
    ['.', 'npm', 'link jest-jasmine2'],
    ['.', 'npm', 'link jest-mock'],
    ['.', 'npm', 'link jest-util'],
  ];
  cmds.forEach(execute);
}
