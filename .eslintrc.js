/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const customImportResolver = path.resolve('./eslintImportResolver');

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
      },
    },
    {
      files: ['examples/**/*'],
      rules: {
        'babel/func-params-comma-dangle': 0,
        'import/no-unresolved': [2, {ignore: ['^react-native$']}],
        'import/order': 0,
      },
    },
    {
      files: ['scripts/**/*', 'integration-tests/**/*'],
      rules: {
        'babel/func-params-comma-dangle': 0,
      },
    },
    {
      files: 'types/**/*',
      rules: {
        'import/no-extraneous-dependencies': 0,
      },
    },
    {
      excludedFiles: [
        'integration-tests/__tests__/**/*',
        'website/versioned_docs/**/*.md',
      ],
      files: [
        'examples/**/*',
        'scripts/**/*',
        'integration-tests/*/**/*',
        'website/*/**/*',
        'eslintImportResolver.js',
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
        'integration-tests/__tests__/**/*',
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
        'integration-tests/**',
        '**/pretty-format/perf/**',
      ],
      rules: {
        'import/no-extraneous-dependencies': 0,
      },
    },
  ],
  parser: 'babel-eslint',
  plugins: ['markdown', 'import', 'prettier'],
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
          'eslintImportResolver.js',
          'testSetupFile.js',
        ],
      },
    ],
    // This has to be disabled until all type and module imports are combined
    // https://github.com/benmosher/eslint-plugin-import/issues/645
    'import/order': 0,
    'no-console': 0,
    'no-unused-vars': 2,
    'prettier/prettier': [
      2,
      {
        bracketSpacing: false,
        printWidth: 80,
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
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
