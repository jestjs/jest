/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * script to build (transpile) files.
 * By default it transpiles all files for all packages and writes them
 * into `build/` directory.
 * Non-js or files matching IGNORE_PATTERN will be copied without transpiling.
 *
 * Example:
 *  node ./scripts/build.js
 *  node ./scripts/build.js /users/123/jest/packages/jest-111/src/111.js
 *
 * NOTE: this script is node@4 compatible
 */

'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const mkdirp = require('mkdirp');

const babel = require('babel-core');
const chalk = require('chalk');
const micromatch = require('micromatch');
const stringLength = require('string-length');
const getPackages = require('./_getPackages');
const browserBuild = require('./browserBuild');

const OK = chalk.reset.inverse.bold.green(' DONE ');
const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const BUILD_ES5_DIR = 'build-es5';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '**/__tests__/**';
const PACKAGES_DIR = path.resolve(__dirname, '../packages');

const INLINE_REQUIRE_BLACKLIST = /packages\/(jest-(circus|diff|get-type|jasmine2|matcher-utils|matchers|message-util|regex-util|snapshot))|pretty-format\//;

const transformOptions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '.babelrc'), 'utf8')
);
transformOptions.babelrc = false;

const adjustToTerminalWidth = str => {
  const columns = process.stdout.columns || 80;
  const WIDTH = columns - stringLength(OK) + 1;
  const strs = str.match(new RegExp(`(.{1,${WIDTH}})`, 'g'));
  let lastString = strs[strs.length - 1];
  if (lastString.length < WIDTH) {
    lastString += Array(WIDTH - lastString.length).join(chalk.dim('.'));
  }
  return strs.slice(0, -1).concat(lastString).join('\n');
};

function getPackageName(file) {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file, buildFolder) {
  const pkgName = getPackageName(file);
  const pkgSrcPath = path.resolve(PACKAGES_DIR, pkgName, SRC_DIR);
  const pkgBuildPath = path.resolve(PACKAGES_DIR, pkgName, buildFolder);
  const relativeToSrcPath = path.relative(pkgSrcPath, file);
  return path.resolve(pkgBuildPath, relativeToSrcPath);
}

function buildNodePackage(p) {
  const srcDir = path.resolve(p, SRC_DIR);
  const pattern = path.resolve(srcDir, '**/*');
  const files = glob.sync(pattern, {
    nodir: true,
  });

  process.stdout.write(adjustToTerminalWidth(`${path.basename(p)}\n`));

  files.forEach(file => buildFile(file, true));
  process.stdout.write(`${OK}\n`);
}

function buildBrowserPackage(p) {
  const srcDir = path.resolve(p, SRC_DIR);
  const pkgJsonPath = path.resolve(p, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    return;
  }

  const browser = require(pkgJsonPath).browser;
  if (browser) {
    if (browser.indexOf(BUILD_ES5_DIR) !== 0) {
      throw new Error(
        `browser field for ${pkgJsonPath} should start with "${BUILD_ES5_DIR}"`
      );
    }
    browserBuild(
      p.split('/').pop(),
      path.resolve(srcDir, 'index.js'),
      path.resolve(p, browser)
    )
      .then(() => {
        process.stdout.write(adjustToTerminalWidth(`${path.basename(p)}\n`));
        process.stdout.write(`${OK}\n`);
      })
      .catch(e => {
        console.error(e);
        process.exit(1);
      });
  }
}

function buildFile(file, silent) {
  const destPath = getBuildPath(file, BUILD_DIR);

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
    const options = Object.assign({}, transformOptions);
    options.plugins = options.plugins.slice();

    if (INLINE_REQUIRE_BLACKLIST.test(file)) {
      options.plugins.push('transform-es2015-modules-commonjs');
    } else {
      options.plugins.push([
        'transform-inline-imports-commonjs',
        {
          allowTopLevelThis: true,
        },
      ]);
    }

    const transformed = babel.transformFileSync(file, options).code;
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

const files = process.argv.slice(2);

if (files.length) {
  files.forEach(buildFile);
} else {
  const packages = getPackages();
  process.stdout.write(chalk.inverse(' Building packages \n'));
  packages.forEach(buildNodePackage);
  process.stdout.write('\n');

  process.stdout.write(chalk.inverse(' Building browser packages \n'));
  packages.forEach(buildBrowserPackage);
}
