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
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const pify = require('pify');
const chalk = require('chalk');
const workerFarm = require('worker-farm');

const getPackages = require('./_getPackages');

const SRC_DIR = 'src';

const babelNodeOptions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '.babelrc'), 'utf8')
);
babelNodeOptions.babelrc = false;

const fixedWidth = str => {
  const WIDTH = 80;
  const strs = str.match(new RegExp(`(.{1,${WIDTH}})`, 'g'));
  let lastString = strs[strs.length - 1];
  if (lastString.length < WIDTH) {
    lastString += Array(WIDTH - lastString.length).join(chalk.dim('.'));
  }
  return strs.slice(0, -1).concat(lastString).join('\n');
};

const farm = workerFarm(path.resolve(__dirname, '_build_worker.js'));
const worker = pify(farm);

const cleanup = () => workerFarm.end(farm);

const buildFiles = files =>
  Promise.all(files.map(file => worker({file, silent: true})));

const buildPackage = p => {
  const srcDir = path.resolve(p, SRC_DIR);
  const pattern = path.resolve(srcDir, '**/*');
  const files = glob.sync(pattern, {nodir: true});

  return buildFiles(files).then(
    () =>
      process.stdout.write(
        `${fixedWidth(`${path.basename(p)}\n`)} [  ${chalk.green('OK')}  ]\n`
      ),
    err =>
      process.stderr.write(`${path.basename(p)} build failed: ${err.message}\n`)
  );
};

const files = process.argv.slice(2);

if (files.length) {
  buildFiles(files).then(cleanup, err =>
    process.stderr.write(`Build failed: ${err.message}\n`)
  );
} else {
  process.stdout.write(chalk.bold.inverse('Building packages\n'));
  Promise.all(getPackages().map(buildPackage)).then(() => {
    cleanup();
    process.stdout.write('\n');
  });
}
