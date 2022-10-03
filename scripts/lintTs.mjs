/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'os';
import * as path from 'path';
import * as url from 'url';
import chalk from 'chalk';
import {ESLint} from 'eslint';
import pLimit from 'p-limit';
import {getPackagesWithTsConfig} from './buildUtils.mjs';

// we want to limit the number of processes we spawn
const cpus = Math.max(1, os.cpus().length - 1);
const mutex = pLimit(cpus);

const fix = process.argv.slice(2).some(arg => arg === '--fix');

const monorepoRoot = path.resolve(url.fileURLToPath(import.meta.url), '../..');

const packagesWithTs = getPackagesWithTsConfig()
  .map(({packageDir}) => packageDir)
  .concat(path.resolve(monorepoRoot, 'e2e'))
  // TODO: run all all projects
  .slice(0, 3);

try {
  await Promise.all(
    packagesWithTs.map(packageDir =>
      mutex(async () => {
        const eslint = new ESLint({
          cache: true,
          cacheLocation: path.resolve(packageDir, '.eslintcache'),
          cwd: monorepoRoot,
          extensions: ['.ts'],
          fix,
          overrideConfig: {
            extends: [
              'plugin:@typescript-eslint/recommended-requiring-type-checking',
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
              project: ['./tsconfig.json', `${packageDir}/tsconfig.json`],
              tsconfigRootDir: monorepoRoot,
            },
            plugins: ['@typescript-eslint'],
            root: true,
          },
        });

        const filesToLint = packageDir.endsWith('e2e')
          ? `${packageDir}/__tests__/`
          : `${packageDir}/src/`;

        let results = await eslint.lintFiles(filesToLint);

        if (fix) {
          await ESLint.outputFixes(results);

          // re-run after outputting fixes
          results = await eslint.lintFiles(filesToLint);
        }

        const filteredResults = ESLint.getErrorResults(results);

        if (filteredResults.length > 0) {
          const formatter = await eslint.loadFormatter('stylish');
          const resultText = formatter.format(results);

          console.error(resultText);

          throw new Error('Got lint errors');
        }
      }),
    ),
  );
} catch (e) {
  console.error(
    chalk.inverse.red(' Unable to lint using TypeScript info files '),
  );

  throw e;
}

console.log(
  chalk.inverse.green(' Successfully linted using TypeScript info files '),
);
