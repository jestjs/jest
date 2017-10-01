/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const customImportResolver = path.resolve('./eslint_import_resolver');

module.exports = {
  extends: [
    './packages/eslint-config-fb-strict/index.js',
    'plugin:import/errors',
    'prettier',
    'prettier/flowtype',
  ],
  overrides: [
    // to make it more suitable for running on code examples in docs/ folder
    {
      files: ['*.md'],
      rules: {
        'consistent-return': 0,
        'flowtype/require-valid-file-annotation': 0,
        'import/no-extraneous-dependencies': 0,
        'import/no-unresolved': 0,
        'jest/no-focused-tests': 0,
        'jest/no-identical-title': 0,
        'jest/valid-expect': 0,
        'no-undef': 0,
        'no-unused-vars': 0,
        'prettier/prettier': 0,
        'react/jsx-no-undef': 0,
        'react/react-in-jsx-scope': 0,
        'sort-keys': 0,
        'unicorn/filename-case': 0,
      },
    },
    {
      files: ['examples/**/*'],
      rules: {
        'babel/func-params-comma-dangle': 0,
        'import/no-unresolved': [2, {ignore: ['^react-native$']}],
        'import/order': 0,
        'unicorn/filename-case': 0,
      },
    },
    {
      files: ['scripts/**/*', 'integration_tests/**/*'],
      rules: {
        'babel/func-params-comma-dangle': 0,
        'unicorn/filename-case': 0,
      },
    },
    {
      files: [
        '**/__mocks__/**/*',
        'website/**/*',
        '**/jest-runtime/**/*',
        '**/src/Console*',
        'packages/jest-cli/src/lib/Prompt.js',
        'packages/jest-cli/src/reporters/Status.js',
        'packages/jest-editor-support/src/Process.js',
        'packages/jest-editor-support/src/Runner.js',
        'packages/jest-editor-support/src/Settings.js',
        'packages/jest-editor-support/src/Snapshot.js',
        'packages/jest-editor-support/src/__tests__/Snapshot-test.js',
        'packages/jest-jasmine2/src/jasmine/Env.js',
        'packages/jest-jasmine2/src/jasmine/Spec.js',
        'packages/jest-jasmine2/src/jasmine/Suite.js',
        'packages/jest-jasmine2/src/jasmine/Timer.js',
        'packages/jest-snapshot/src/State.js',
      ],
      rules: {
        'unicorn/filename-case': 0,
      },
    },
    {
      excludedFiles: 'integration_tests/__tests__/**/*',
      files: [
        'examples/**/*',
        'scripts/**/*',
        'integration_tests/*/**/*',
        'website/*/**/*',
        'eslint_import_resolver.js',
      ],
      rules: {
        'prettier/prettier': [
          2,
          {
            bracketSpacing: false,
            printWidth: 80,
            singleQuote: true,
            trailingComma: 'es5',
          },
        ],
      },
    },
    {
      files: [
        'integration_tests/__tests__/**/*',
        'packages/babel-jest/**/*.test.js',
        'packages/babel-plugin-jest-hoist/**/*.test.js',
        'packages/babel-preset-jest/**/*.test.js',
        'packages/eslint-config-fb-strict/**/*.test.js',
        'packages/eslint-plugin-jest/**/*.test.js',
        'packages/jest-changed-files/**/*.test.js',
        'packages/jest-circus/**/*.test.js',
        'packages/jest-diff/**/*.test.js',
        'packages/jest-docblock/**/*.test.js',
        'packages/jest-editor-support/**/*.test.js',
        'packages/jest/**/*.test.js',
        'packages/pretty-format/**/*.test.js',
      ],
      rules: {
        'flowtype/require-valid-file-annotation': [2, 'always'],
      },
    },
    {
      files: [
        'website/**',
        '**/__tests__/**',
        'integration_tests/**',
        '**/pretty-format/perf/**',
      ],
      rules: {
        'import/no-extraneous-dependencies': 0,
      },
    },
  ],
  parser: 'babel-eslint',
  plugins: ['markdown', 'import', 'unicorn', 'prettier'],
  rules: {
    'flowtype/boolean-style': 2,
    'flowtype/no-primitive-constructor-types': 2,
    'flowtype/require-valid-file-annotation': 2,
    'import/no-duplicates': 2,
    'import/no-extraneous-dependencies': [
      2,
      {
        devDependencies: [
          '**/__tests__/**',
          '**/__mocks__/**',
          '**/?(*.)(spec|test).js?(x)',
          'scripts/**',
          'eslint_import_resolver.js',
          'test_setup_file.js',
        ],
      },
    ],
    // This has to be disabled until all type and module imports are combined
    // https://github.com/benmosher/eslint-plugin-import/issues/645
    'import/order': 0,
    'no-console': 0,
    'prettier/prettier': [
      2,
      {
        bracketSpacing: false,
        printWidth: 80,
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
    'unicorn/filename-case': [2, {case: 'snakeCase'}],
  },
  settings: {
    'import/resolver': {
      [customImportResolver]: {
        moduleNameMapper: {
          '^types/(.*)': './types/$1',
        },
      },
    },
  },
};
