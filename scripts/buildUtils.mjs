/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {strict as assert} from 'assert';
import {createRequire} from 'module';
import * as path from 'path';
import {fileURLToPath} from 'url';
import chalk from 'chalk';
import fs from 'graceful-fs';
import {sync as readPkg} from 'read-pkg';
import stringLength from 'string-length';

export const PACKAGES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../packages',
);

export const OK = chalk.reset.inverse.bold.green(' DONE ');

// Get absolute paths of all directories under packages/*
export function getPackages() {
  const packages = fs
    .readdirSync(PACKAGES_DIR)
    .map(file => path.resolve(PACKAGES_DIR, file))
    .filter(f => fs.lstatSync(path.resolve(f)).isDirectory())
    .filter(f => fs.existsSync(path.join(path.resolve(f), 'package.json')));
  const require = createRequire(import.meta.url);
  const rootPackage = require('../package.json');

  const nodeEngineRequirement = rootPackage.engines.node;

  return packages.map(packageDir => {
    const pkg = readPkg({cwd: packageDir});

    assert.ok(pkg.engines, `Engine requirement in "${pkg.name}" should exist`);

    assert.strictEqual(
      pkg.engines.node,
      nodeEngineRequirement,
      `Engine requirement in "${pkg.name}" should match root`,
    );

    assert.ok(
      pkg.exports,
      `Package "${pkg.name}" is missing \`exports\` field`,
    );
    assert.deepStrictEqual(
      pkg.exports,
      {
        '.':
          pkg.types == null
            ? pkg.main
            : {
                types: pkg.types,
                // eslint-disable-next-line sort-keys
                default: pkg.main,
              },
        './package.json': './package.json',
        ...Object.values(pkg.bin || {}).reduce(
          (mem, curr) =>
            Object.assign(mem, {[curr.replace(/\.js$/, '')]: curr}),
          {},
        ),
        ...(pkg.name === 'jest-circus' ? {'./runner': './runner.js'} : {}),
        ...(pkg.name === 'expect'
          ? {
              './build/matchers': './build/matchers.js',
              './build/toThrowMatchers': './build/toThrowMatchers.js',
            }
          : {}),
      },
      `Package "${pkg.name}" does not export correct files`,
    );

    if (pkg.types) {
      assert.strictEqual(
        pkg.main,
        './build/index.js',
        `Package "${pkg.name}" should have "./build/index.js" as main`,
      );
      assert.strictEqual(
        pkg.types,
        './build/index.d.ts',
        `Package "${pkg.name}" should have "./build/index.d.ts" as types`,
      );
    } else {
      assert.strictEqual(
        pkg.main,
        './index.js',
        `Package "${pkg.name}" should have "./index.js" as main`,
      );
    }

    if (pkg.bin) {
      Object.entries(pkg.bin).forEach(([binName, binPath]) => {
        const fullBinPath = path.resolve(packageDir, binPath);

        if (!fs.existsSync(fullBinPath)) {
          throw new Error(
            `Binary in package "${pkg.name}" with name "${binName}" at ${binPath} does not exist`,
          );
        }
      });
    }

    return {packageDir, pkg};
  });
}

export function adjustToTerminalWidth(str) {
  const columns = process.stdout.columns || 80;
  const WIDTH = columns - stringLength(OK) + 1;
  const strs = str.match(new RegExp(`(.{1,${WIDTH}})`, 'g'));
  let lastString = strs[strs.length - 1];
  if (lastString.length < WIDTH) {
    lastString += Array(WIDTH - lastString.length).join(chalk.dim('.'));
  }
  return strs.slice(0, -1).concat(lastString).join('\n');
}

export function getPackagesWithTsConfig() {
  return getPackages().filter(p =>
    fs.existsSync(path.resolve(p.packageDir, 'tsconfig.json')),
  );
}
