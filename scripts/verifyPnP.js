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
const rimraf = require('rimraf');
const tempy = require('tempy');

const packagesDirectory = path.resolve(__dirname, '../packages');
const jestDirectory = path.resolve(packagesDirectory, './jest');

const cwd = tempy.directory();

try {
  fs.writeFileSync(
    path.join(cwd, '.yarnrc.yml'),
    `
      enableGlobalCache: true

      yarnPath: ${require.resolve('../.yarn/releases/yarn-2.4.1.cjs')}
  `,
  );
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify(
      {
        dependencies: {
          jest: `link:${jestDirectory}`,
        },
        name: 'test-pnp',
        // resolutions: Object.fromEntries(
        //   glob
        //     .sync(packagesDirectory + '/*')
        //     .map(pkgDir => [
        //       require(path.join(pkgDir, 'package.json')).name,
        //       `portal:${pkgDir}`,
        //     ])
        //     .sort(([l], [r]) => l.localeCompare(r)),
        // ),
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(cwd, 'test.js'),
    `
     /*
      * @jest-environment jsdom
      */

     test('dummy', () => {
       expect(window).toBeDefined();
     });
    `,
  );
  execa.sync('yarn', [], {cwd, stdio: 'inherit'});
  execa.sync('yarn', ['jest'], {cwd, stdio: 'inherit'});

  console.log(chalk.inverse.green(` Successfully ran Jest with PnP linker `));
} finally {
  rimraf.sync(cwd);
}
