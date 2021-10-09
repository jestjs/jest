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
const dedent = require('dedent');
const execa = require('execa');
const rimraf = require('rimraf');
const tempy = require('tempy');

const rootDirectory = path.resolve(__dirname, '..');

const cwd = tempy.directory();

try {
  fs.writeFileSync(
    path.join(cwd, '.yarnrc.yml'),
    dedent`
      enableGlobalCache: true

      yarnPath: ${require.resolve('../.yarn/releases/yarn-2.4.3.cjs')}
    `,
  );
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify(
      {
        dependencies: {
          jest: `*`,
        },
        name: 'test-pnp',
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(cwd, 'test.js'),
    dedent`
     /*
      * @jest-environment jsdom
      */

     test('dummy', () => {
       expect(window).toBeDefined();
     });
    `,
  );
  execa.sync('yarn', ['link', '--private', '--all', rootDirectory], {
    cwd,
    stdio: 'inherit',
  });
  execa.sync('yarn', ['jest'], {cwd, stdio: 'inherit'});

  console.log(chalk.inverse.green(` Successfully ran Jest with PnP linker `));
} finally {
  rimraf.sync(cwd);
}
