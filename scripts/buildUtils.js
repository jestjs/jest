/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const stringLength = require('string-length');
const rootPackage = require('../package.json');

const PACKAGES_DIR = path.resolve(__dirname, '../packages');

const OK = chalk.reset.inverse.bold.green(' DONE ');

// Get absolute paths of all directories under packages/*
module.exports.getPackages = function getPackages() {
  const packages = fs
    .readdirSync(PACKAGES_DIR)
    .map(file => path.resolve(PACKAGES_DIR, file))
    .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

  const nodeEngineRequiremnt = rootPackage.engines.node;

  packages.forEach(packageDir => {
    const pkg = require(`${packageDir}/package.json`);

    assert.ok(pkg.engines, `Engine requirement in ${pkg.name} should exist`);

    assert.equal(
      pkg.engines.node,
      nodeEngineRequiremnt,
      `Engine requirement in ${pkg.name} should match root`,
    );
  });

  return packages;
};

module.exports.adjustToTerminalWidth = function adjustToTerminalWidth(str) {
  const columns = process.stdout.columns || 80;
  const WIDTH = columns - stringLength(OK) + 1;
  const strs = str.match(new RegExp(`(.{1,${WIDTH}})`, 'g'));
  let lastString = strs[strs.length - 1];
  if (lastString.length < WIDTH) {
    lastString += Array(WIDTH - lastString.length).join(chalk.dim('.'));
  }
  return strs.slice(0, -1).concat(lastString).join('\n');
};

module.exports.OK = OK;
module.exports.PACKAGES_DIR = PACKAGES_DIR;
