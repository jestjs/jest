/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {strict as assert} from 'assert';
import {createRequire} from 'module';
import * as path from 'path';
import util from 'util';
import dedent from 'dedent';
import fs from 'graceful-fs';
import pico from 'picocolors';
import webpack from 'webpack';
import {
  ERROR,
  OK,
  createBuildConfigs,
  createWebpackConfigs,
  typeOnlyPackages,
} from './buildUtils.mjs';

const require = createRequire(import.meta.url);

async function buildNodePackages() {
  process.stdout.write(pico.inverse(' Bundling packages \n'));

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
    const entryPointFile = path.resolve(packageDir, pkg.main);

    assert.ok(
      fs.existsSync(entryPointFile),
      `Main file "${pkg.main}" in "${pkg.name}" should exist`,
    );

    if (typeOnlyPackages.has(pkg.name)) {
      continue;
    }

    // TODO: can we get exports from a file from webpack's `stats`?
    const cjsModule = require(entryPointFile);
    const exportStatements = Object.keys(cjsModule)
      .filter(name => name !== '__esModule' && name !== 'default')
      .map(name => `export const ${name} = cjsModule.${name};`);

    if (cjsModule.default) {
      exportStatements.push('export default cjsModule.default;');
    }

    if (exportStatements.length === 0) {
      throw new Error(`No exports found in package ${pkg.name}`);
    }

    const mjsEntryFile = entryPointFile.replace(/\.js$/, '.mjs');

    const esSource = dedent`
      import cjsModule from './index.js';

      ${exportStatements.join('\n')}
    `;

    await fs.promises.writeFile(mjsEntryFile, `${esSource}\n`);
  }

  process.stdout.write(`${OK}\n`);
}

try {
  await buildNodePackages();
} catch (error) {
  process.stderr.write(`${ERROR}\n`);
  console.error(error);
  process.exitCode = 1;
}
