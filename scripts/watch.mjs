/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Watch files for changes and rebuild (copy from 'src/' to `build/`) if changed
 */

import chalk from 'chalk';
import webpack from 'webpack';
import {createWebpackConfigs} from './buildUtils.mjs';

const compiler = webpack(createWebpackConfigs());

let hasBuilt = false;

console.log(chalk.inverse(' Bundling packages '));

compiler.watch({}, (error, stats) => {
  if (!hasBuilt) {
    hasBuilt = true;

    console.log(chalk.red('->'), chalk.cyan('Watching for changes…'));
  }

  if (error) {
    console.error('Got error from watch mode', error);
  }

  if (stats) {
    const info = stats.toJson();

    if (stats.hasErrors() || stats.hasWarnings()) {
      for (const error of info.errors) {
        console.error('error', error.message);
      }
      for (const warning of info.warnings) {
        console.warn('warning', warning.message);
      }
    } else {
      console.log(chalk.red('->'), chalk.green('Rebuilt packages'));
    }
  }
});
