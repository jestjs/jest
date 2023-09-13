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
const packagesNotToTest = [
  'expect',
  'expect-utils',
  'jest-circus',
  'jest-cli',
  'jest-config',
  'jest-core',
  'jest-create-cache-key-function',
  'jest-diff',
  'jest-each',
  'jest-environment-jsdom',
  'jest-environment-node',
  'jest-fake-timers',
  'jest-get-type',
  'jest-haste-map',
  'jest-jasmine2',
  'jest-leak-detector',
  'jest-matcher-utils',
  'jest-message-util',
  'jest-mock',
  'jest-phabricator',
  'jest-regex-util',
  'jest-repl',
  'jest-reporters',
  'jest-resolve',
  'jest-runner',
  'jest-runtime',
  'jest-snapshot',
  'jest-util',
  'jest-validate',
  'jest-worker',
  'pretty-format',
];

const packagesWithTs = getPackagesWithTsConfig()
  .map(({packageDir}) => packageDir)
  .filter(
    packageDir => !packagesNotToTest.some(pkg => packageDir.endsWith(pkg)),
  );
// .concat(path.resolve(monorepoRoot, 'e2e'));

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
