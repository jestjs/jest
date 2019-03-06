/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  extends: [
    './packages/eslint-config-fb-strict/index.js',
    'plugin:import/errors',
    'prettier',
    'prettier/flowtype',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        '@typescript-eslint/array-type': ['error', 'generic'],
        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {argsIgnorePattern: '^_'},
        ],
        'import/order': 'error',
        'no-dupe-class-members': 'off',
        'no-unused-vars': 'off',
      },
    },
    // to make it more suitable for running on code examples in docs/ folder
    {
      files: ['*.md'],
      rules: {
        'arrow-body-style': 0,
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
      files: ['scripts/**/*', 'e2e/**/*'],
      rules: {
        'babel/func-params-comma-dangle': 0,
      },
    },
    {
      files: ['packages/jest-types/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 0,
      },
    },
    {
      files: [
        'website/**',
        '**/__tests__/**',
        'e2e/**',
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
    'arrow-body-style': 2,
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
    'prettier/prettier': 2,
  },
  settings: {
    'import/resolver': {
      'eslint-import-resolver-typescript': true,
    },
  },
};
