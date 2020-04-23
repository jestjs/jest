/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const chalk = require('chalk');
const execa = require('execa');
const rimraf = require('rimraf');
const throat = require('throat');
const {getPackages} = require('./buildUtils');

const packages = getPackages();

const packagesWithTs = packages.filter(p =>
  fs.existsSync(path.resolve(p, 'tsconfig.json'))
);

packagesWithTs.forEach(pkgDir => {
  const pkg = require(pkgDir + '/package.json');

  assert.ok(pkg.types, `Package ${pkg.name} is missing \`types\` field`);
  assert.ok(
    pkg.typesVersions,
    `Package ${pkg.name} is missing \`typesVersions\` field`
  );

  assert.equal(
    pkg.types,
    pkg.main.replace(/\.js$/, '.d.ts'),
    `\`main\` and \`types\` field of ${pkg.name} does not match`
  );
});

const args = [
  '--silent',
  'tsc',
  '-b',
  ...packagesWithTs,
  ...process.argv.slice(2),
];

console.log(chalk.inverse(' Building TypeScript definition files '));

try {
  execa.sync('yarn', args, {stdio: 'inherit'});
  console.log(
    chalk.inverse.green(' Successfully built TypeScript definition files ')
  );
} catch (e) {
  console.error(
    chalk.inverse.red(' Unable to build TypeScript definition files ')
  );
  console.error(e.stack);
  process.exitCode = 1;
  return;
}

const downlevelArgs = ['--silent', 'downlevel-dts', 'build', 'build/ts3.4'];

console.log(chalk.inverse(' Downleveling TypeScript definition files '));

// we want to limit the number of processes we spawn
const cpus = Math.max(1, os.cpus().length - 1);

Promise.all(
  packagesWithTs.map(
    throat(cpus, pkgDir => {
      // otherwise we get nested `ts3.4` directories
      rimraf.sync(path.resolve(pkgDir, 'build/ts3.4'));

      return execa('yarn', downlevelArgs, {cwd: pkgDir, stdio: 'inherit'});
    })
  )
)
  .then(() => {
    console.log(
      chalk.inverse.green(
        ' Successfully downleveled TypeScript definition files '
      )
    );
  })
  .catch(e => {
    console.error(
      chalk.inverse.red(' Unable to downlevel TypeScript definition files ')
    );
    console.error(e.stack);
    process.exitCode = 1;
  });
