/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const cpus = Math.max(
  1,
  (typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length) - 1,
);

const mutex = pLimit(cpus);

const fix = process.argv.slice(2).some(arg => arg === '--fix');

const monorepoRoot = path.resolve(url.fileURLToPath(import.meta.url), '../..');

// TODO: remove this list at some point and run against all packages
const packagesToTest = [
  'babel-jest',
  'babel-plugin-jest-hoist',
  'diff-sequences',
  'jest',
  'jest-changed-files',
  'jest-console',
  'jest-docblock',
  'jest-environment',
  'jest-globals',
  'jest-resolve-dependencies',
  'jest-schemas',
  'jest-source-map',
  'jest-test-result',
  'jest-test-sequencer',
  'jest-transform',
  'jest-types',
  'jest-watcher',
  'test-globals',
  'test-utils',
];

const packagesWithTs = getPackagesWithTsConfig()
  .map(({packageDir}) => packageDir)
  .concat(path.resolve(monorepoRoot, 'e2e'))
  .filter(packageDir => packagesToTest.some(pkg => packageDir.endsWith(pkg)));

const allLintResults = [];

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
          fixTypes: ['problem', 'suggestion', 'layout'],
          overrideConfig: {
            extends: [
              'plugin:@typescript-eslint/recommended-requiring-type-checking',
            ],
            overrides: [
              {
                files: ['**/__tests__/**'],
                plugins: ['jest'],
                rules: {
                  '@typescript-eslint/unbound-method': 'off',
                  'jest/unbound-method': 'error',
                },
              },
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
              project: ['./tsconfig.json', `${packageDir}/tsconfig.json`],
              tsconfigRootDir: monorepoRoot,
            },
            plugins: ['@typescript-eslint'],
            root: true,
            rules: {
              '@typescript-eslint/consistent-type-exports': 'error',
              '@typescript-eslint/dot-notation': 'error',
              '@typescript-eslint/non-nullable-type-assertion-style': 'error',
              '@typescript-eslint/prefer-nullish-coalescing': 'error',
              '@typescript-eslint/prefer-readonly': 'error',
              // TODO: activate this at some point
              // '@typescript-eslint/prefer-readonly-parameter-types': 'error',
              '@typescript-eslint/prefer-reduce-type-parameter': 'error',
              '@typescript-eslint/return-await': 'error',
              '@typescript-eslint/strict-boolean-expressions': 'error',
              '@typescript-eslint/switch-exhaustiveness-check': 'error',
            },
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

        allLintResults.push(...filteredResults);
      }),
    ),
  );
} catch (e) {
  console.error(
    chalk.inverse.red(' Unable to lint using TypeScript info files '),
  );

  throw e;
}

if (allLintResults.length > 0) {
  const eslint = new ESLint({cwd: monorepoRoot});
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(allLintResults);

  console.error(resultText);

  console.error(
    chalk.inverse.red(' Unable to lint using TypeScript info files '),
  );

  process.exitCode = 1;
} else {
  console.log(
    chalk.inverse.green(' Successfully linted using TypeScript info files '),
  );
}
