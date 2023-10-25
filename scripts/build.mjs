/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {strict as assert} from 'assert';
import * as path from 'path';
import util from 'util';
import chalk from 'chalk';
import fs from 'graceful-fs';
import webpack from 'webpack';
import {
  ERROR,
  OK,
  createBuildConfigs,
  createWebpackConfigs,
} from './buildUtils.mjs';

async function buildNodePackages() {
  process.stdout.write(chalk.inverse(' Bundling packages \n'));

  const buildConfigs = createBuildConfigs();

  const compiler = webpack(createWebpackConfigs(buildConfigs));

  let stats;
  try {
    stats = await util.promisify(compiler.run.bind(compiler))();
    await util.promisify(compiler.close.bind(compiler))();

    assert.ok(!stats.hasErrors(), 'Must not have errors or warnings');
  } catch (error) {
    process.stdout.write(`${ERROR}\n\n`);

    if (stats) {
      const info = stats.toJson();

      for (const error of info.errors) {
        console.error('error', error.message);
      }
      for (const warning of info.warnings) {
        console.warn('warning', warning.message);
      }
    }

    throw error;
  }

  for (const {packageDir, pkg} of buildConfigs) {
    assert.ok(
      fs.existsSync(path.resolve(packageDir, pkg.main)),
      `Main file "${pkg.main}" in "${pkg.name}" should exist`,
    );
  }

  process.stdout.write(`${OK}\n`);
}

buildNodePackages().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
