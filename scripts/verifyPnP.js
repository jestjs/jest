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
const yaml = require('js-yaml');
const rimraf = require('rimraf');
const tempy = require('tempy');

const rootDirectory = path.resolve(__dirname, '..');

const cwd = tempy.directory();

try {
  const yarnRcPath = path.resolve(rootDirectory, '.yarnrc.yml');
  const yarnConfig = yaml.load(fs.readFileSync(yarnRcPath, 'utf8'), {
    filename: yarnRcPath,
  });

  fs.writeFileSync(
    path.join(cwd, '.yarnrc.yml'),
    dedent`
      enableGlobalCache: true

      yarnPath: ${path.resolve(rootDirectory, yarnConfig.yarnPath)}
    `,
  );
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify(
      {
        dependencies: {
          jest: '*',
          'jest-environment-jsdom': '*',
        },
        name: 'test-pnp',
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(cwd, 'jsdom.test.js'),
    dedent`
     /*
      * @jest-environment jsdom
      */

     test('dummy', () => {
       expect(window).toBeDefined();
     });
    `,
  );
  fs.writeFileSync(
    path.join(cwd, 'node.test.js'),
    dedent`
     test('dummy', () => {
       expect(typeof window).toBe('undefined');
     });
    `,
  );
  execa.sync('yarn', ['link', '--private', '--all', rootDirectory], {
    cwd,
    stdio: 'inherit',
  });
  execa.sync('yarn', ['jest'], {cwd, stdio: 'inherit'});

  console.log(chalk.inverse.green(' Successfully ran Jest with PnP linker '));
} finally {
  rimraf.sync(cwd);
}
