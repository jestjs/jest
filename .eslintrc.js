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
    'plugin:import/typescript',
    'prettier',
    'prettier/flowtype',
    'plugin:eslint-comments/recommended',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        '@typescript-eslint/array-type': ['error', {default: 'generic'}],
        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {argsIgnorePattern: '^_'},
        ],
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        // Since we do `export =`. Remove for Jest 25
        'import/default': 'off',
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
      files: 'packages/jest-types/**/*',
      rules: {
        'import/no-extraneous-dependencies': 0,
      },
    },
    {
      files: 'packages/**/*.ts',
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 2,
      },
    },
    {
      files: [
        '**/__tests__/**',
        '**/__mocks__/**',
        'packages/jest-jasmine2/src/jasmine/**/*',
        'packages/expect/src/jasmineUtils.ts',
        '**/vendor/**/*',
      ],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 0,
      },
    },
    {
      files: [
        'packages/jest-jasmine2/src/jasmine/**/*',
        'packages/expect/src/jasmineUtils.ts',
        '**/vendor/**/*',
      ],
      rules: {
        'eslint-comments/disable-enable-pair': 0,
        'eslint-comments/no-unlimited-disable': 0,
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
  plugins: ['markdown', 'import', 'prettier', 'eslint-comments'],
  rules: {
    'arrow-body-style': 2,
    'eslint-comments/no-unused-disable': 2,
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
          'babel.config.js',
          'testSetupFile.js',
        ],
      },
    ],
    'import/no-unresolved': [2, {ignore: ['fsevents']}],
    // This has to be disabled until all type and module imports are combined
    // https://github.com/benmosher/eslint-plugin-import/issues/645
    'import/order': 0,
    'no-console': 0,
    'no-restricted-imports': [
      2,
      {
        message: 'Please use graceful-fs instead.',
        name: 'fs',
      },
    ],
    'no-unused-vars': 2,
    'prettier/prettier': 2,
    'sort-imports': [2, {ignoreDeclarationSort: true}],
  },
  settings: {
    'import/ignore': ['react-native'],
  },
};
