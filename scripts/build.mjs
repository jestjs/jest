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
import {ERROR, OK, createWebpackConfigs} from './buildUtils.mjs';

async function buildNodePackages() {
  process.stdout.write(chalk.inverse(' Bundling packages \n'));

  const webpackConfigs = createWebpackConfigs();
  const compiler = webpack(
    webpackConfigs
      .map(({webpackConfig}) => webpackConfig)
      .filter(config => config != null),
  );

  let stats;
  try {
    stats = await util.promisify(compiler.run.bind(compiler))();
    await util.promisify(compiler.close.bind(compiler))();

    assert.ok(!stats.hasErrors(), 'Must not have errors or warnings');
  } catch (error) {
    process.stdout.write(`${ERROR}\n\n`);

    if (stats) {
      const info = stats.toJson();

      if (stats.hasErrors()) {
        console.error('errors', info.errors);
      }
    }

    throw error;
  }

  for (const {packageDir, pkg} of webpackConfigs) {
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
