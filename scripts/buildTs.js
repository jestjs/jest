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
const util = require('util');

const chalk = require('chalk');
const execa = require('execa');
const globby = require('globby');
const throat = require('throat');
const {getPackages} = require('./buildUtils');

const readFilePromise = util.promisify(fs.readFile);

const packages = getPackages();

const packagesWithTs = packages.filter(p =>
  fs.existsSync(path.resolve(p, 'tsconfig.json')),
);

packagesWithTs.forEach(pkgDir => {
  const pkg = require(pkgDir + '/package.json');

  assert.ok(pkg.types, `Package ${pkg.name} is missing \`types\` field`);

  assert.equal(
    pkg.types,
    pkg.main.replace(/\.js$/, '.d.ts'),
    `\`main\` and \`types\` field of ${pkg.name} does not match`,
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
    chalk.inverse.green(' Successfully built TypeScript definition files '),
  );
} catch (e) {
  console.error(
    chalk.inverse.red(' Unable to build TypeScript definition files '),
  );
  console.error(e.stack);
  process.exitCode = 1;
  return;
}

// we want to limit the number of processes we spawn
const cpus = Math.max(1, os.cpus().length - 1);

Promise.all(
  packagesWithTs.map(
    throat(cpus, async pkgDir => {
      const buildDir = path.resolve(pkgDir, 'build/**/*.d.ts');
      const ts3dot4 = path.resolve(pkgDir, 'build/ts3.4');

      const globbed = await globby([buildDir, `!${ts3dot4}`]);

      const files = await Promise.all(
        globbed.map(file => Promise.all([file, readFilePromise(file, 'utf8')])),
      );

      const filesWithReferences = files
        .filter(([, content]) => content.includes('/// <reference types'))
        .map(([name, content]) => [
          name,
          content
            .split('\n')
            .filter(line => line !== '/// <reference types="node" />')
            .filter(line => line.includes('/// <reference types'))
            .join('\n'),
        ])
        .filter(([, content]) => content.length > 0)
        .filter(hit => hit.length > 0)
        .map(([file, references]) =>
          chalk.red(
            `${chalk.bold(
              file,
            )} has the following non-node type references:\n\n${references}\n`,
          ),
        )
        .join('\n\n');

      if (filesWithReferences) {
        console.error(filesWithReferences);

        process.exit(1);
      }
    }),
  ),
).catch(e => {
  console.error(
    chalk.inverse.red(' Unable to validate TypeScript definition files '),
  );
  console.error(e.stack);
  process.exitCode = 1;
});
