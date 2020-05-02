/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * script to build (transpile) files.
 * By default it transpiles js files for all packages and writes them
 * into `build/` directory.
 * Non-js files not matching IGNORE_PATTERN will be copied without transpiling.
 *
 * Example:
 *  node ./scripts/build.js
 *  node ./scripts/build.js /users/123/jest/packages/jest-111/src/111.js
 *
 * NOTE: this script is node@6 compatible
 */

'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const makeDir = require('make-dir');

const babel = require('@babel/core');
const chalk = require('chalk');
const micromatch = require('micromatch');
const prettier = require('prettier');
const {getPackages, adjustToTerminalWidth, OK} = require('./buildUtils');

const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const JS_FILES_PATTERN = '**/*.js';
const TS_FILES_PATTERN = '**/*.ts';
const IGNORE_PATTERN = '**/__{tests,mocks}__/**';
const PACKAGES_DIR = path.resolve(__dirname, '../packages');

const INLINE_REQUIRE_BLACKLIST = /packages\/expect|(jest-(circus|diff|get-type|jasmine2|matcher-utils|message-util|regex-util|snapshot))|pretty-format\//;

const transformOptions = require('../babel.config.js');

const prettierConfig = prettier.resolveConfig.sync(__filename);
prettierConfig.trailingComma = 'none';
prettierConfig.parser = 'babel';

function getPackageName(file) {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file, buildFolder) {
  const pkgName = getPackageName(file);
  const pkgSrcPath = path.resolve(PACKAGES_DIR, pkgName, SRC_DIR);
  const pkgBuildPath = path.resolve(PACKAGES_DIR, pkgName, buildFolder);
  const relativeToSrcPath = path.relative(pkgSrcPath, file);
  return path.resolve(pkgBuildPath, relativeToSrcPath).replace(/\.ts$/, '.js');
}

function buildNodePackage(p) {
  const srcDir = path.resolve(p, SRC_DIR);
  const pattern = path.resolve(srcDir, '**/*');
  const files = glob.sync(pattern, {nodir: true});

  process.stdout.write(adjustToTerminalWidth(`${path.basename(p)}\n`));

  files.forEach(file => buildFile(file, true));

  process.stdout.write(`${OK}\n`);
}

function buildFile(file, silent) {
  const destPath = getBuildPath(file, BUILD_DIR);

  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    silent ||
      process.stdout.write(
        chalk.dim('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          ' (ignore)\n',
      );
    return;
  }

  makeDir.sync(path.dirname(destPath));
  if (
    !micromatch.isMatch(file, JS_FILES_PATTERN) &&
    !micromatch.isMatch(file, TS_FILES_PATTERN)
  ) {
    fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    silent ||
      process.stdout.write(
        chalk.red('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.red(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath) +
          ' (copy)' +
          '\n',
      );
  } else {
    const options = Object.assign({}, transformOptions);
    options.plugins = options.plugins.slice();

    if (INLINE_REQUIRE_BLACKLIST.test(file)) {
      // The modules in the blacklist are injected into the user's sandbox
      // We need to guard some globals there.
      options.plugins.push(
        require.resolve('./babel-plugin-jest-native-globals'),
      );
    } else {
      options.plugins = options.plugins.map(plugin => {
        if (
          Array.isArray(plugin) &&
          plugin[0] === '@babel/plugin-transform-modules-commonjs'
        ) {
          return [
            plugin[0],
            Object.assign({}, plugin[1], {
              lazy: string =>
                // we want to lazyload all non-local modules plus `importEsm` - the latter to avoid syntax errors. Set to just `true` when we drop support for node 8
                !string.startsWith('./') || string === './importEsm',
            }),
          ];
        }

        return plugin;
      });
    }

    const transformed = babel.transformFileSync(file, options).code;
    const prettyCode = prettier.format(transformed, prettierConfig);

    fs.writeFileSync(destPath, prettyCode);

    silent ||
      process.stdout.write(
        chalk.green('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.green(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath) +
          '\n',
      );
  }
}

const files = process.argv.slice(2);

if (files.length) {
  files.forEach(file => buildFile(file));
} else {
  const packages = getPackages();
  process.stdout.write(chalk.inverse(' Building packages \n'));
  packages.forEach(buildNodePackage);
}
