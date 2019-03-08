/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const execa = require('execa');
const glob = require('glob');
const cpFile = require('cp-file');
const {getPackages, adjustToTerminalWidth, OK} = require('./buildUtils');

const packages = getPackages();

const packagesWithTs = packages.filter(p =>
  fs.existsSync(path.resolve(p, 'tsconfig.json'))
);

const args = ['-b', ...packagesWithTs, ...process.argv.slice(2)];

console.log(chalk.inverse('Building TypeScript definition files'));
process.stdout.write(adjustToTerminalWidth('Building\n'));

try {
  execa.sync('tsc', args, {stdio: 'inherit'});
  packagesWithTs.forEach(p => {
    const srcDir = path.resolve(p, 'src');
    const buildDir = path.resolve(p, 'build');

    glob.sync(path.join(srcDir, '**/*.d.ts')).forEach(file => {
      const resultFile = path.resolve(buildDir, path.relative(srcDir, file));

      cpFile.sync(file, resultFile);
    });
  });
  process.stdout.write(`${OK}\n`);
} catch (e) {
  process.stdout.write('\n');
  console.error(
    chalk.inverse.red('Unable to build TypeScript definition files')
  );
  console.error(e.stack);
  process.exitCode = 1;
}
