/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
 *  node ./scripts/build.mjs
 *  node ./scripts/build.mjs /users/123/jest/packages/jest-111/src/111.js
 */

import {strict as assert} from 'assert';
import * as path from 'path';
import {fileURLToPath} from 'url';
import babel from '@babel/core';
import chalk from 'chalk';
import {glob} from 'glob';
import fs from 'graceful-fs';
import micromatch from 'micromatch';
import prettier from 'prettier';
import transformOptions from '../babel.config.js';
import {
  OK,
  PACKAGES_DIR,
  adjustToTerminalWidth,
  getPackages,
} from './buildUtils.mjs';

const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const JS_FILES_PATTERN = '**/*.js';
const TS_FILES_PATTERN = '**/*.ts';
const IGNORE_PATTERN = '**/__{tests,mocks}__/**';

const INLINE_REQUIRE_EXCLUDE_LIST =
  /packages\/expect|(jest-(circus|diff|get-type|jasmine2|matcher-utils|message-util|regex-util|snapshot))|pretty-format\//;

const prettierConfig = prettier.resolveConfig.sync(
  fileURLToPath(import.meta.url),
);
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

function buildNodePackage({packageDir, pkg}) {
  const srcDir = path.resolve(packageDir, SRC_DIR);
  const files = glob.sync('**/*', {absolute: true, cwd: srcDir, nodir: true});

  process.stdout.write(adjustToTerminalWidth(`${pkg.name}\n`));

  files.forEach(file => buildFile(file, true));

  assert.ok(
    fs.existsSync(path.resolve(packageDir, pkg.main)),
    `Main file "${pkg.main}" in ${pkg.name} should exist`,
  );

  process.stdout.write(`${OK}\n`);
}

function buildFile(file, silent) {
  const destPath = getBuildPath(file, BUILD_DIR);

  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    silent ||
      process.stdout.write(
        `${
          chalk.dim('  \u2022 ') + path.relative(PACKAGES_DIR, file)
        } (ignore)\n`,
      );
    return;
  }

  fs.mkdirSync(path.dirname(destPath), {recursive: true});
  if (
    !micromatch.isMatch(file, JS_FILES_PATTERN) &&
    !micromatch.isMatch(file, TS_FILES_PATTERN)
  ) {
    fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    silent ||
      process.stdout.write(
        `${
          chalk.red('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.red(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath)
        } (copy)\n`,
      );
  } else {
    const options = Object.assign({}, transformOptions);
    options.plugins = options.plugins.slice();

    if (INLINE_REQUIRE_EXCLUDE_LIST.test(file)) {
      // The excluded modules are injected into the user's sandbox
      // We need to guard some globals there.
      options.plugins.push(
        path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          'babel-plugin-jest-native-globals.js',
        ),
      );
    } else {
      options.plugins = options.plugins.map(plugin => {
        if (
          Array.isArray(plugin) &&
          plugin[0] === '@babel/plugin-transform-modules-commonjs'
        ) {
          return [plugin[0], Object.assign({}, plugin[1], {lazy: true})];
        }

        return plugin;
      });
    }

    const transformed = babel.transformFileSync(file, options).code;
    const prettyCode = prettier.format(transformed, prettierConfig);

    fs.writeFileSync(destPath, prettyCode);

    silent ||
      process.stdout.write(
        `${
          chalk.green('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.green(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath)
        }\n`,
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
