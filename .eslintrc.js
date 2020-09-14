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
      extends: ['plugin:@typescript-eslint/eslint-recommended'],
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin', 'local'],
      rules: {
        '@typescript-eslint/array-type': ['error', {default: 'generic'}],
        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {argsIgnorePattern: '^_'},
        ],
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        // Since we do `export =`. Remove for Jest 27
        'import/default': 'off',
        'no-dupe-class-members': 'off',
        'no-unused-vars': 'off',
        // TODO: turn these on at some point
        'prefer-rest-params': 'off',
        'prefer-spread': 'off',
      },
    },
    {
      files: [
        'e2e/babel-plugin-jest-hoist/__tests__/typescript.test.ts',
        'e2e/coverage-remapping/covered.ts',
        'packages/expect/src/matchers.ts',
        'packages/expect/src/print.ts',
        'packages/expect/src/toThrowMatchers.ts',
        'packages/expect/src/types.ts',
        'packages/expect/src/utils.ts',
        'packages/jest-core/src/ReporterDispatcher.ts',
        'packages/jest-core/src/TestScheduler.ts',
        'packages/jest-core/src/collectHandles.ts',
        'packages/jest-core/src/plugins/update_snapshots_interactive.ts',
        'packages/jest-fake-timers/src/legacyFakeTimers.ts',
        'packages/jest-haste-map/src/index.ts',
        'packages/jest-haste-map/src/lib/FSEventsWatcher.ts',
        'packages/jest-jasmine2/src/jasmine/SpyStrategy.ts',
        'packages/jest-jasmine2/src/jasmine/Suite.ts',
        'packages/jest-leak-detector/src/index.ts',
        'packages/jest-matcher-utils/src/index.ts',
        'packages/jest-mock/src/__tests__/index.test.ts',
        'packages/jest-mock/src/index.ts',
        'packages/jest-snapshot/src/index.ts',
        'packages/jest-snapshot/src/printSnapshot.ts',
        'packages/jest-snapshot/src/types.ts',
        'packages/jest-util/src/convertDescriptorToString.ts',
        'packages/jest-worker/src/Farm.ts',
        'packages/jest-worker/src/index.ts',
        'packages/pretty-format/src/index.ts',
        'packages/pretty-format/src/plugins/DOMCollection.ts',
      ],
      rules: {
        '@typescript-eslint/ban-types': [
          'error',
          // TODO: remove these overrides: https://github.com/facebook/jest/issues/10177
          {types: {Function: false, object: false, '{}': false}},
        ],
        'local/ban-types-eventually': [
          'warn',
          {
            types: {
              // none of these types are in use, so can be errored on
              Boolean: false,
              Number: false,
              Object: false,
              String: false,
              Symbol: false,
            },
          },
        ],
      },
    },

    // to make it more suitable for running on code examples in docs/ folder
    {
      files: ['*.md'],
      rules: {
        'arrow-body-style': 'off',
        'consistent-return': 'off',
        'flowtype/require-valid-file-annotation': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
        'jest/no-focused-tests': 'off',
        'jest/no-identical-title': 'off',
        'jest/valid-expect': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'prettier/prettier': 'off',
        'react/jsx-no-undef': 'off',
        'react/react-in-jsx-scope': 'off',
        'sort-keys': 'off',
      },
    },
    {
      files: ['examples/**/*'],
      rules: {
        'babel/func-params-comma-dangle': 'off',
        'import/no-unresolved': ['error', {ignore: ['^react-native$']}],
        'import/order': 'off',
      },
    },
    {
      files: ['scripts/**/*', 'e2e/**/*'],
      rules: {
        'babel/func-params-comma-dangle': 'off',
      },
    },
    {
      files: 'packages/jest-types/**/*',
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: 'packages/**/*.ts',
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'error',
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
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: [
        'packages/jest-jasmine2/src/jasmine/**/*',
        'packages/expect/src/jasmineUtils.ts',
        '**/vendor/**/*',
      ],
      rules: {
        'eslint-comments/disable-enable-pair': 'off',
        'eslint-comments/no-unlimited-disable': 'off',
      },
    },
    {
      files: [
        'e2e/error-on-deprecated/__tests__/*',
        'e2e/jasmine-async/__tests__/*',
      ],
      globals: {
        fail: true,
        jasmine: true,
        pending: true,
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
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['test-types/*.test.ts'],
      rules: {
        'jest/no-focused-tests': 'off',
        'jest/no-identical-title': 'off',
        'jest/valid-expect': 'off',
      },
    },
  ],
  parser: 'babel-eslint',
  plugins: ['markdown', 'import', 'prettier', 'eslint-comments'],
  rules: {
    'arrow-body-style': 'error',
    'eslint-comments/disable-enable-pair': ['error', {allowWholeFile: true}],
    'eslint-comments/no-unused-disable': 'error',
    'flowtype/boolean-style': 'error',
    'flowtype/no-primitive-constructor-types': 'error',
    'flowtype/require-valid-file-annotation': 'error',
    'import/no-duplicates': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '/test-types/**',
          '**/__tests__/**',
          '**/__mocks__/**',
          '**/?(*.)(spec|test).js?(x)',
          'scripts/**',
          'babel.config.js',
          'testSetupFile.js',
        ],
      },
    ],
    'import/no-unresolved': ['error', {ignore: ['fsevents']}],
    'import/order': 'error',
    'no-console': 'off',
    'no-restricted-imports': [
      'error',
      {
        message: 'Please use graceful-fs instead.',
        name: 'fs',
      },
    ],
    'no-unused-vars': 'error',
    'prettier/prettier': 'error',
    'sort-imports': ['error', {ignoreDeclarationSort: true}],
  },
  settings: {
    'import/ignore': ['react-native'],
  },
};
