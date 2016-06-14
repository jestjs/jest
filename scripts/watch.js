/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Watch files for changes and rebuild (copy from 'src/' to `build/`) if changed
 */

const fs = require('fs');
const getPackages = require('./_getPackages');
const execSync = require('child_process').execSync;
const chalk = require('chalk');
const path = require('path');

const BUILD_CMD = `node ${path.resolve(__dirname, './build.js')}`;

let filesToBuild = new Map();

const rebuild = filename => filesToBuild.set(filename, true);

getPackages().forEach(p => {
  const srcDir = path.resolve(p, 'src');
  try {
    fs.accessSync(srcDir, fs.F_OK);
    fs.watch(path.resolve(p, 'src'), {recursive: true}, (event, filename) => {
      if (['change', 'rename'].indexOf(event) !== -1) {
        console.log(chalk.green('->'), `${event}: ${filename}`);
        rebuild(path.resolve(srcDir, filename));
      }
    });
  } catch (e) {
    // doesn't exist
  }
});

setInterval(() => {
  const files = Array.from(filesToBuild.keys());
  if (files.length) {
    filesToBuild = new Map();
    execSync(`${BUILD_CMD} ${files.join(' ')}`, {stdio: [0, 1, 2]});
  }
}, 100);

console.log(chalk.red('->'), chalk.cyan('Watching for changes...'));
