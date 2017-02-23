/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * Test packed and ready to be published npm packages in real world environment.
 *
 * This test will catch bugs related to publishing packages, eg:
 *   - package is installed locally, but not included in `package.json`
 *   - package files are not published because they're in `.npmignore`
 *   - or `.gitignore`
 *   - or not added to `files` property in 'package.json'
 *
 * How it works:
 *  1. Pack all `packages/*` using `npm pack`
 *  2. Install all created tarballs as packages into a `TMP/node_modules` dir
 *  3. Run integration test suite using the installed packages.
 */
const ProgressBar = require('progress');

const chalk = require('chalk');
const execSync = require('child_process').execSync;
const getPackages = require('./_getPackages');
const os = require('os');
const path = require('path');
const runCommand = require('./_runCommand');

const TMP = path.resolve(os.tmpdir(), 'jest_npm_package_test');
const packages = getPackages();

const packingProgress = new ProgressBar(
  chalk.green('-> ') + 'Packing packages: [:bar] :current/:total',
  {total: packages.length}
);

// Array of [
//  packageName,
//  jest-*.tar.gz files containing ready to be published npm packages
// ]
const tars = packages.map(p => {
  let tar = execSync('npm pack', {cwd: p}).toString();
  if (tar[tar.length - 1] === '\n') {
    tar = tar.slice(0, -1);
  }
  packingProgress.tick();
  return path.resolve(p, tar);
});

console.log('');

runCommand('rm', `-rf ${TMP}`);
runCommand('mkdir', `-p ${path.resolve(TMP, 'node_modules')}`);

runCommand('npm', `i ${tars.join(' ')}`, TMP);
runCommand('rm', tars.join(' ')); // clean up

const JEST_CLI = path.resolve(TMP, 'node_modules/jest-cli/bin/jest.js');

runCommand(JEST_CLI, '', path.resolve(__dirname, '../integration_tests'));
runCommand('rm', `-rf ${TMP}`);
