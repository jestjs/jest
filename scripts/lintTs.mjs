/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable sort-keys */

import * as os from 'os';
import * as path from 'path';
import * as url from 'url';
import chalk from 'chalk';
import {ESLint} from 'eslint';
import eslintPluginJest from 'eslint-plugin-jest';
import pLimit from 'p-limit';
import typescriptEslint from 'typescript-eslint';
import {getPackagesWithTsConfig} from './buildUtils.mjs';

// we want to limit the number of processes we spawn
const cpus = Math.max(1, os.availableParallelism() - 1);

const mutex = pLimit(cpus);

const fix = process.argv.slice(2).includes('--fix');

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
  'jest-pattern',
  'jest-phabricator',
  'jest-regex-util',
  'jest-reporters',
  'jest-resolve',
  'jest-runner',
  'jest-runtime',
  'jest-snapshot',
  'jest-snapshot-utils',
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
          fix,
          fixTypes: ['problem', 'suggestion', 'layout'],
          overrideConfig: typescriptEslint.config(
            typescriptEslint.configs.recommendedTypeChecked,
            typescriptEslint.configs.stylisticTypeChecked,
            {
              languageOptions: {
                parserOptions: {
                  EXPERIMENTAL_useProjectService: true,
                  project: ['./tsconfig.json', `${packageDir}/tsconfig.json`],
                  tsconfigRootDir: monorepoRoot,
                },
              },
              rules: {
                '@typescript-eslint/consistent-type-exports': 'error',
                '@typescript-eslint/dot-notation': 'error',
                '@typescript-eslint/no-base-to-string': [
                  'error',
                  // https://github.com/typescript-eslint/typescript-eslint/issues/1655#issuecomment-593639305
                  {ignoredTypeNames: ['AssertionError', 'Error']},
                ],
                '@typescript-eslint/no-duplicate-type-constituents': 'error',
                '@typescript-eslint/no-redundant-type-constituents': 'error',
                '@typescript-eslint/no-unnecessary-template-expression':
                  'error',
                '@typescript-eslint/non-nullable-type-assertion-style': 'error',
                '@typescript-eslint/prefer-nullish-coalescing': 'error',
                '@typescript-eslint/prefer-readonly': 'error',
                // TODO: activate this at some point
                // '@typescript-eslint/prefer-readonly-parameter-types': 'error',
                '@typescript-eslint/prefer-reduce-type-parameter': 'error',
                '@typescript-eslint/return-await': 'error',
                '@typescript-eslint/strict-boolean-expressions': 'error',
                '@typescript-eslint/switch-exhaustiveness-check': 'error',

                // TODO: enable this
                '@typescript-eslint/no-explicit-any': 'off',

                // disable the ones we disable in main config
                '@typescript-eslint/no-invalid-void-type': 'off',
                '@typescript-eslint/no-dynamic-delete': 'off',
                '@typescript-eslint/no-var-requires': 'off',
                '@typescript-eslint/consistent-type-definitions': 'off',

                // nah
                '@typescript-eslint/consistent-indexed-object-style': 'off',
                '@typescript-eslint/require-await': 'off',

                // TODO: enable these
                '@typescript-eslint/no-require-imports': 'off',
                '@typescript-eslint/no-unsafe-call': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off',
                '@typescript-eslint/no-unsafe-assignment': 'off',
                '@typescript-eslint/no-unsafe-argument': 'off',
                '@typescript-eslint/no-unsafe-return': 'off',
                '@typescript-eslint/prefer-regexp-exec': 'off',
              },
            },

            {
              files: ['**/__tests__/**'],
              plugins: {jest: eslintPluginJest},
              rules: {
                '@typescript-eslint/unbound-method': 'off',
                '@typescript-eslint/no-empty-function': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                'jest/unbound-method': 'error',
              },
            },
            {
              files: ['packages/jest-types/src/Global.ts'],
              rules: {
                '@typescript-eslint/no-unsafe-function-type': 'off',
              },
            },
            {
              files: ['packages/create-jest/src/generateConfigFile.ts'],
              rules: {
                '@typescript-eslint/restrict-template-expressions': 'off',
              },
            },
            {
              files: [
                'packages/jest-types/src/Circus.ts',
                'packages/create-jest/src/generateConfigFile.ts',
                'packages/jest-environment-jsdom-abstract/src/index.ts',
                'packages/jest-environment/src/index.ts',
                'packages/jest-globals/src/index.ts',
                'packages/jest-test-result/src/types.ts',
                'packages/jest-test-sequencer/src/index.ts',
                'packages/jest-types/src/Circus.ts',
                'packages/jest-types/src/Config.ts',
                'packages/jest-types/src/Global.ts',
                'packages/test-globals/src/index.ts',
              ],
              rules: {
                // We're faking nominal types
                '@typescript-eslint/no-duplicate-type-constituents': 'off',
                // this file has `Exception`, which is `unknown`
                '@typescript-eslint/no-redundant-type-constituents': 'off',
              },
            },
            {
              files: [
                'packages/babel-plugin-jest-hoist/src/index.ts',
                'packages/babel-jest/src/index.ts',
                'packages/babel-plugin-jest-hoist/src/index.ts',
                'packages/packages/create-jest/src/runCreate.ts',
                'packages/babel-jest/src/index.ts',
                'packages/babel-jest/src/index.ts',
                'packages/create-jest/src/runCreate.ts',
                'packages/jest-changed-files/src/index.ts',
                'packages/jest-console/src/BufferedConsole.ts',
                'packages/jest-console/src/CustomConsole.ts',
                'packages/jest-environment-jsdom-abstract/src/index.ts',
                'packages/jest-resolve-dependencies/src/index.ts',
                'packages/jest-test-result/src/formatTestResults.ts',
                'packages/jest-test-result/src/helpers.ts',
                'packages/jest-test-sequencer/src/index.ts',
                'packages/jest-transform/src/ScriptTransformer.ts',
                'packages/jest-transform/src/shouldInstrument.ts',
              ],
              rules: {
                '@typescript-eslint/strict-boolean-expressions': 'off',
              },
            },
            {ignores: ['**/*.js', '**/*.cjs', '**/*.mjs']},
          ),
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
} catch (error) {
  console.error(
    chalk.inverse.red(' Unable to lint using TypeScript info files '),
  );

  throw error;
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
