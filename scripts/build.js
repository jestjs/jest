/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * script to build (transpile) files.
 * By default it transpiles all files for all packages and writes them
 * into `build/` directory.
 * Non-js or files matching IGNORE_PATTERN will be copied without transpiling.
 *
 * Example:
 *  node ./scripts/build.js
 *  node ./scripts/build.js /users/123/jest/packages/jest-111/src/111.js
 */

const babel = require('babel-core');
const chalk = require('chalk');
const fs = require('fs');
const getPackages = require('./_getPackages');
const glob = require('glob');
const minimatch = require('minimatch');
const path = require('path');
const spawnSync = require('child_process').spawnSync;

const SRC_DIR = 'src';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '';
const PACKAGES_DIR = path.resolve(__dirname, '../packages');

function buildPackage(p) {
  const srcDir = path.resolve(p, SRC_DIR);
  const pattern = path.resolve(srcDir, '**/*');
  const files = glob.sync(pattern, {nodir: true});

  process.stdout.write(
    chalk.inverse(`Building package: ${path.basename(p)}\n`)
  );

  files.forEach(buildFile);
}

function buildFile(file) {
  const packageName = path.relative(PACKAGES_DIR, file).split(path.sep)[0];
  const packageSrcPath = path.resolve(PACKAGES_DIR, packageName, 'src');
  const packageBuildPath = path.resolve(PACKAGES_DIR, packageName, 'build');
  const relativeToSrcPath = path.relative(packageSrcPath, file);
  const destPath = path.resolve(packageBuildPath, relativeToSrcPath);

  spawnSync('mkdir', ['-p', path.dirname(destPath)]);

  if (minimatch(file, IGNORE_PATTERN) || !minimatch(file, JS_FILES_PATTERN)) {
    fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    process.stdout.write(
      chalk.red('  \u2022 ') +
      path.relative(PACKAGES_DIR, file) +
      chalk.red(' \u21D2 ') +
      path.relative(PACKAGES_DIR, destPath) +
      ' (copy)' +
      '\n'
    );
  } else {
    const transformed = babel.transformFileSync(file, {
      plugins: [
        'syntax-trailing-function-commas',
        'transform-flow-strip-types',
      ],
      retainLines: true,
      babelrc: false,
    }).code;
    spawnSync('mkdir', ['-p', path.dirname(destPath)]);
    fs.writeFileSync(destPath, transformed);
    process.stdout.write(
      chalk.green('  \u2022 ') +
      path.relative(PACKAGES_DIR, file) +
      chalk.green(' \u21D2 ') +
      path.relative(PACKAGES_DIR, destPath) +
      '\n'
    );
  }
}

const files = process.argv.slice(2);

if (files.length) {
  files.forEach(buildFile);
} else {
  getPackages().forEach(buildPackage);
  process.stdout.write('\n');
}
