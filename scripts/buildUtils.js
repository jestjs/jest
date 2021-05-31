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
const {sync: readPkg} = require('read-pkg');
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

  const nodeEngineRequirement = rootPackage.engines.node;

  packages.forEach(packageDir => {
    const pkg = readPkg({cwd: packageDir});

    assert.ok(pkg.engines, `Engine requirement in ${pkg.name} should exist`);

    assert.strictEqual(
      pkg.engines.node,
      // TODO: remove special casing for Jest 28
      pkg.name === 'jest-worker' ? '>= 10.13.0' : nodeEngineRequirement,
      `Engine requirement in ${pkg.name} should match root`,
    );

    assert.ok(pkg.exports, `Package ${pkg.name} is missing \`exports\` field`);
    assert.deepStrictEqual(
      pkg.exports,
      {
        '.': pkg.main,
        './package.json': './package.json',
        ...Object.values(pkg.bin || {}).reduce(
          (mem, curr) =>
            Object.assign(mem, {[curr.replace(/\.js$/, '')]: curr}),
          {},
        ),
        ...(pkg.name === 'jest-circus' ? {'./runner': './runner.js'} : {}),
        ...(pkg.name === 'expect' ? {'./build/utils': './build/utils.js'} : {}),
      },
      `Package ${pkg.name} does not export correct files`,
    );

    if (pkg.bin) {
      Object.entries(pkg.bin).forEach(([binName, binPath]) => {
        const fullBinPath = path.resolve(packageDir, binPath);

        if (!fs.existsSync(fullBinPath)) {
          throw new Error(
            `Binary in package ${pkg.name} with name "${binName}" at ${binPath} does not exist`,
          );
        }
      });
    }
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
