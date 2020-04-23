/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Watch files for changes and rebuild (copy from 'src/' to `build/`) if changed
 */

const fs = require('fs');
const chokidar = require('chokidar');
const {execSync} = require('child_process');
const path = require('path');
const chalk = require('chalk');
const {PACKAGES_DIR, getPackages} = require('./buildUtils');

const BUILD_CMD = `node ${path.resolve(__dirname, './build.js')}`;

let filesToBuild = new Map();

const exists = filename => {
  try {
    return fs.statSync(filename).isFile();
  } catch (e) {}
  return false;
};
const rebuild = filename => filesToBuild.set(filename, true);

chokidar
  .watch(
    getPackages().map(p => path.resolve(p, 'src')),
    {
      ignoreInitial: true,
      ignored: /(^|[\/\\])\../, // ignore dotfiles
    },
  )
  .on('all', (event, filePath) => {
    if (
      (event === 'change' || event === 'rename' || event === 'add') &&
      exists(filePath)
    ) {
      console.log(
        chalk.green('->'),
        `${event}: ${path.relative(PACKAGES_DIR, filePath)}`,
      );
      rebuild(filePath);
    } else {
      filePath.split(path.join(path.sep, 'src', path.sep));
      const buildFile = filePath
        .replace(
          path.join(path.sep, 'src', path.sep),
          path.join(path.sep, 'build', path.sep),
        )
        .replace(/\.ts$/, '.js');
      try {
        fs.unlinkSync(buildFile);
        process.stdout.write(
          `${chalk.red('  \u2022 ')}${path.relative(
            PACKAGES_DIR,
            buildFile,
          )} (deleted)\n`,
        );
      } catch (e) {}
    }
  });

setInterval(() => {
  const files = Array.from(filesToBuild.keys());
  if (files.length) {
    filesToBuild = new Map();
    try {
      execSync(`${BUILD_CMD} ${files.join(' ')}`, {stdio: [0, 1, 2]});
    } catch (e) {}
  }
}, 100);

console.log(chalk.red('->'), chalk.cyan('Watching for changes...'));
