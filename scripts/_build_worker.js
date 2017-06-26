/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const babel = require('babel-core');
const chalk = require('chalk');
const micromatch = require('micromatch');

const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const BUILD_ES5_DIR = 'build-es5';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '**/__tests__/**';
const PACKAGES_DIR = path.resolve(__dirname, '../packages');

const babelNodeOptions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '.babelrc'), 'utf8')
);
babelNodeOptions.babelrc = false;
const babelEs5Options = Object.assign(
  {},
  babelNodeOptions,
  {presets: 'env'},
  {plugins: [...babelNodeOptions.plugins, 'transform-runtime']}
);

function getPackageName(file) {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file, pkgName, buildFolder) {
  const pkgSrcPath = path.resolve(PACKAGES_DIR, pkgName, SRC_DIR);
  const pkgBuildPath = path.resolve(PACKAGES_DIR, pkgName, buildFolder);
  const relativeToSrcPath = path.relative(pkgSrcPath, file);
  return path.resolve(pkgBuildPath, relativeToSrcPath);
}

function buildFileFor(file, pkgName, silent, env) {
  const buildDir = env === 'es5' ? BUILD_ES5_DIR : BUILD_DIR;
  const destPath = getBuildPath(file, pkgName, buildDir);
  const babelOptions = env === 'es5' ? babelEs5Options : babelNodeOptions;

  mkdirp.sync(path.dirname(destPath));
  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    silent ||
      process.stdout.write(
        chalk.dim('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          ' (ignore)\n'
      );
  } else if (!micromatch.isMatch(file, JS_FILES_PATTERN)) {
    fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    silent ||
      process.stdout.write(
        chalk.red('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.red(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath) +
          ' (copy)' +
          '\n'
      );
  } else {
    const transformed = babel.transformFileSync(file, babelOptions).code;
    fs.writeFileSync(destPath, transformed);
    silent ||
      process.stdout.write(
        chalk.green('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.green(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath) +
          '\n'
      );
  }
}

module.exports = ({file, silent}, callback) => {
  try {
    const packageName = getPackageName(file);
    buildFileFor(file, packageName, silent, 'node');

    const pkgJsonPath = path.resolve(PACKAGES_DIR, packageName, 'package.json');
    const {browser} = require(pkgJsonPath);
    if (browser) {
      if (browser.indexOf(BUILD_ES5_DIR) !== 0) {
        throw new Error(
          `browser field for ${pkgJsonPath} should start with "${BUILD_ES5_DIR}"`
        );
      }
      buildFileFor(file, packageName, silent, 'es5');
    }
    callback();
  } catch (err) {
    callback(err);
  }
};
