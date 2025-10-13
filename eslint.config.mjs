/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable sort-keys */

import fs from 'fs';
import path from 'path';
import eslintJs from '@eslint/js';
import eslintMarkdown from '@eslint/markdown';
import eslintPluginEslintCommentsConfigs from '@eslint-community/eslint-plugin-eslint-comments/configs';
import {defineConfig} from 'eslint/config';
import {createTypeScriptImportResolver} from 'eslint-import-resolver-typescript';
import eslintPluginImportX from 'eslint-plugin-import-x';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginJsdoc from 'eslint-plugin-jsdoc';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import {sync as readPkg} from 'read-pkg';
import typescriptEslint from 'typescript-eslint';
import eslintPluginLocal from './.eslintplugin/index.mjs';

function getPackages() {
  const PACKAGES_DIR = path.resolve(import.meta.dirname, 'packages');
  const packages = fs
    .readdirSync(PACKAGES_DIR)
    .map(file => path.resolve(PACKAGES_DIR, file))
    .filter(f => fs.lstatSync(path.resolve(f)).isDirectory())
    .filter(f => fs.existsSync(path.join(path.resolve(f), 'package.json')));
  return packages.map(packageDir => {
    const pkg = readPkg({cwd: packageDir});
    return pkg.name;
  });
}

const config = defineConfig(
  eslintJs.configs.recommended,
  eslintMarkdown.configs.recommended,
  ...eslintMarkdown.configs.processor,
  eslintPluginImportX.flatConfigs.errors,
  eslintPluginEslintCommentsConfigs.recommended,
  eslintPluginUnicorn.configs.recommended,
  eslintPluginPromise.configs['flat/recommended'],
  eslintPluginPrettierRecommended,
  {
    languageOptions: {globals: {...globals.builtins, console: 'readonly'}},
    plugins: {jsdoc: eslintPluginJsdoc, local: eslintPluginLocal},
    settings: {
      'import-x/ignore': ['react-native'],
      // using `new RegExp` makes sure to escape `/`
      'import-x/internal-regex': new RegExp(
        getPackages()
          .map(pkg => `^${pkg}$`)
          .join('|'),
      ).source,
      'import-x/resolver-next': createTypeScriptImportResolver(),
    },
    rules: {
      'accessor-pairs': ['warn', {setWithoutGet: true}],
      'block-scoped-var': 'off',
      'callback-return': 'off',
      camelcase: ['off', {properties: 'always'}],
      complexity: 'off',
      'consistent-return': 'warn',
      'consistent-this': ['off', 'self'],
      'constructor-super': 'error',
      'default-case': 'off',
      'dot-notation': 'off',
      eqeqeq: ['error', 'smart'],
      '@eslint-community/eslint-comments/disable-enable-pair': [
        'error',
        {allowWholeFile: true},
      ],
      '@eslint-community/eslint-comments/no-unused-disable': 'error',
      'func-names': 'off',
      'func-style': ['off', 'declaration'],
      'global-require': 'off',
      'guard-for-in': 'off',
      'handle-callback-err': 'off',
      'id-length': 'off',
      'id-match': 'off',
      'import-x/no-duplicates': 'error',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/__mocks__/**',
            '**/__tests__/**',
            '**/__typetests__/**',
            '**/?(*.)(spec|test).js?(x)',
            'scripts/**',
            'babel.config.js',
            'testSetupFile.js',
            'eslint.config.mjs',
            'yarn.config.cjs',
          ],
        },
      ],
      'import-x/no-unresolved': ['error', {ignore: ['fsevents']}],
      'import-x/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
          },
          // this is the default order except for added `internal` in the middle
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'never',
        },
      ],
      'init-declarations': 'off',
      'jsdoc/check-alignment': 'error',
      'lines-around-comment': 'off',
      'max-depth': 'off',
      'max-nested-callbacks': 'off',
      'max-params': 'off',
      'max-statements': 'off',
      'new-cap': 'off',
      'new-parens': 'error',
      'newline-after-var': 'off',
      'no-alert': 'off',
      'no-array-constructor': 'error',
      'no-bitwise': 'warn',
      'no-caller': 'error',
      'no-case-declarations': 'off',
      'no-class-assign': 'warn',
      'no-cond-assign': 'off',
      'no-confusing-arrow': 'off',
      'no-console': [
        'warn',
        {allow: ['warn', 'error', 'time', 'timeEnd', 'timeStamp']},
      ],
      'no-const-assign': 'error',
      'no-constant-condition': 'error',
      'no-constant-binary-expression': 'error',
      'no-continue': 'off',
      'no-control-regex': 'off',
      'no-debugger': 'error',
      'no-delete-var': 'error',
      'no-div-regex': 'off',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'off',
      'no-empty': 'off',
      'no-empty-character-class': 'warn',
      'no-empty-pattern': 'warn',
      'no-eq-null': 'off',
      'no-eval': 'error',
      'no-ex-assign': 'warn',
      'no-extend-native': 'warn',
      'no-extra-bind': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-fallthrough': 'warn',
      'no-floating-decimal': 'error',
      'no-func-assign': 'error',
      'no-implicit-coercion': 'off',
      'no-implied-eval': 'error',
      'no-inline-comments': 'off',
      'no-inner-declarations': 'off',
      'no-invalid-regexp': 'warn',
      'no-invalid-this': 'off',
      'no-irregular-whitespace': 'error',
      'no-iterator': 'off',
      'no-label-var': 'warn',
      'no-labels': ['error', {allowLoop: true, allowSwitch: true}],
      'no-lonely-if': 'off',
      'no-loop-func': 'off',
      'no-magic-numbers': 'off',
      'no-mixed-requires': 'off',
      'no-mixed-spaces-and-tabs': 'error',
      'no-multi-str': 'error',
      'no-multiple-empty-lines': 'off',
      'no-native-reassign': ['error', {exceptions: ['Map', 'Set']}],
      'no-negated-in-lhs': 'error',
      'no-new': 'warn',
      'no-new-func': 'error',
      'no-new-object': 'warn',
      'no-new-require': 'off',
      'no-new-wrappers': 'warn',
      'no-obj-calls': 'error',
      'no-octal': 'warn',
      'no-octal-escape': 'warn',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'no-process-env': 'off',
      'no-process-exit': 'off',
      'no-proto': 'error',
      'no-prototype-builtins': 'error',
      'no-redeclare': 'warn',
      'no-regex-spaces': 'warn',
      'no-restricted-globals': [
        'error',
        {message: 'Use `globalThis` instead.', name: 'global'},
      ],
      'no-restricted-imports': [
        'error',
        {message: 'Please use graceful-fs instead.', name: 'fs'},
      ],
      'no-restricted-modules': 'off',
      'no-restricted-syntax': 'off',
      'no-return-assign': 'off',
      'no-script-url': 'error',
      'no-self-compare': 'warn',
      'no-sequences': 'warn',
      'no-shadow': 'off',
      'no-shadow-restricted-names': 'warn',
      'no-sparse-arrays': 'error',
      'no-sync': 'off',
      'no-ternary': 'off',
      'no-this-before-super': 'error',
      'no-throw-literal': 'error',
      'no-undef': 'error',
      'no-undef-init': 'off',
      'no-undefined': 'off',
      'no-underscore-dangle': 'off',
      'no-unneeded-ternary': 'warn',
      'no-unreachable': 'error',
      'no-unused-expressions': 'off',
      'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      'no-use-before-define': 'off',
      'no-useless-call': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-var': 'error',
      'no-void': 'off',
      'no-warn-comments': 'off',
      'no-with': 'off',
      'object-shorthand': 'error',
      'one-var': ['warn', {initialized: 'never'}],
      'operator-assignment': ['warn', 'always'],
      'operator-linebreak': 'off',
      'padded-blocks': 'off',
      'prefer-arrow-callback': ['error', {allowNamedFunctions: true}],
      'prefer-const': 'error',
      'prefer-template': 'error',

      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      'promise/no-callback-in-promise': 'off',

      quotes: [
        'error',
        'single',
        {allowTemplateLiterals: false, avoidEscape: true},
      ],
      radix: 'warn',
      'require-jsdoc': 'off',
      'require-yield': 'off',
      'sort-imports': ['error', {ignoreDeclarationSort: true}],
      'sort-keys': 'error',
      'sort-vars': 'off',
      'spaced-comment': ['off', 'always', {exceptions: ['eslint', 'global']}],
      strict: 'off',
      'use-isnan': 'error',
      'valid-jsdoc': 'off',
      'valid-typeof': 'error',
      'vars-on-top': 'off',
      'wrap-iife': 'off',
      'wrap-regex': 'off',
      yoda: 'off',

      // doesn't work without ESModuleInterop
      'unicorn/import-style': 'off',
      // we're a CJS project
      'unicorn/prefer-module': 'off',

      // enforced by `@typescript-eslint/no-this-alias` already
      'unicorn/no-this-assignment': 'off',

      // Not an issue with TypeScript
      'unicorn/no-array-callback-reference': 'off',

      // reduce is fine
      'unicorn/no-array-reduce': 'off',

      // this is very aggressive (600+ files changed). might make sense to apply bit by bit over time?
      'unicorn/prevent-abbreviations': 'off',

      // nah
      'unicorn/consistent-destructuring': 'off',
      'unicorn/no-lonely-if': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-event-target': 'off',
      'unicorn/prefer-switch': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/switch-case-braces': 'off',

      // TODO: decide whether or not we want these
      'unicorn/filename-case': 'off',
      'unicorn/prefer-reflect-apply': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-structured-clone': 'off',

      // enabling this is blocked by https://github.com/microsoft/rushstack/issues/2780
      'unicorn/prefer-export-from': 'off',
      // enabling this is blocked by https://github.com/jestjs/jest/pull/14297
      'unicorn/prefer-node-protocol': 'off',
    },
  },
  [
    typescriptEslint.configs.eslintRecommended,
    typescriptEslint.configs.strict,
    typescriptEslint.configs.stylistic,
    eslintPluginImportX.flatConfigs.typescript,
    {
      rules: {
        '@typescript-eslint/array-type': ['error', {default: 'generic'}],
        '@typescript-eslint/no-restricted-types': 'error',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {fixStyle: 'inline-type-imports', disallowTypeAnnotations: false},
        ],
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {argsIgnorePattern: '^_'},
        ],
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/consistent-indexed-object-style': 'off',
        // TS verifies these
        'consistent-return': 'off',
        'no-dupe-class-members': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-dynamic-delete': 'off',
        // TODO: enable at some point
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-invalid-void-type': 'off',
        '@typescript-eslint/consistent-type-definitions': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        'import-x/no-unresolved': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',

        // not needed to be enforced for TS
        'import-x/namespace': 'off',
      },
    },
  ]
    .flat()
    .map(config => ({...config, files: ['**/*.ts', '**/*.tsx']})),

  {
    files: [
      'packages/jest-mock/src/__tests__/index.test.ts',
      'packages/jest-mock/src/index.ts',
      'packages/pretty-format/src/__tests__/Immutable.test.ts',
      'packages/pretty-format/src/__tests__/prettyFormat.test.ts',
    ],
    rules: {
      'local/prefer-rest-params-eventually': 'warn',
      'prefer-rest-params': 'off',
    },
  },
  {
    files: [
      'packages/expect/src/index.ts',
      'packages/jest-fake-timers/src/legacyFakeTimers.ts',
      'packages/jest-jasmine2/src/jestExpect.ts',
    ],
    rules: {
      'local/prefer-spread-eventually': 'warn',
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
      'packages/expect-utils/src/utils.ts',
      'packages/jest-core/src/collectHandles.ts',
      'packages/jest-core/src/plugins/UpdateSnapshotsInteractive.ts',
      'packages/jest-leak-detector/src/index.ts',
      'packages/jest-matcher-utils/src/index.ts',
      'packages/jest-mock/src/__tests__/index.test.ts',
      'packages/jest-mock/src/index.ts',
      'packages/jest-snapshot/src/index.ts',
      'packages/jest-snapshot/src/printSnapshot.ts',
      'packages/jest-snapshot/src/types.ts',
      'packages/jest-util/src/convertDescriptorToString.ts',
      'packages/pretty-format/src/index.ts',
      'packages/pretty-format/src/plugins/DOMCollection.ts',
    ],
    rules: {
      'local/no-restricted-types-eventually': [
        'warn',
        {
          types: {
            // none of these types are in use, so can be errored on
            Boolean: true,
            Number: true,
            Object: true,
            String: true,
            Symbol: true,
          },
        },
      ],
    },
  },
  {
    files: ['e2e/coverage-remapping/covered.ts'],
    rules: {
      'no-constant-binary-expression': 'off',
      'no-constant-condition': 'off',
    },
  },

  // 'eslint-plugin-jest' rules for test and test related files
  {
    files: [
      '**/__mocks__/**',
      '**/__tests__/**',
      '**/*.md/**',
      '**/*.test.*',
      'e2e/babel-plugin-jest-hoist/mockFile.js',
      'e2e/failures/macros.js',
      'e2e/test-in-root/*.js',
      'e2e/test-match/test-suites/*',
      'e2e/test-match-default/dot-spec-tests/*',
      'packages/test-utils/src/ConditionalTest.ts',
    ],
    ...eslintPluginJest.configs['flat/style'],
    ignores: ['**/__typetests__/**'],
    rules: {
      ...eslintPluginJest.configs['flat/style'].rules,
      'jest/no-alias-methods': 'error',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/require-to-throw-message': 'error',
      'jest/valid-expect': 'error',
      'import-x/order': 'off',
    },
  },

  {
    files: ['e2e/__tests__/*'],
    rules: {
      'jest/no-restricted-jest-methods': [
        'error',
        {
          fn: 'Please use fixtures instead of mocks in the end-to-end tests.',
          mock: 'Please use fixtures instead of mocks in the end-to-end tests.',
          doMock:
            'Please use fixtures instead of mocks in the end-to-end tests.',
          setMock:
            'Please use fixtures instead of mocks in the end-to-end tests.',
          spyOn:
            'Please use fixtures instead of mocks in the end-to-end tests.',
        },
      ],
    },
  },

  {
    files: [
      'website/docusaurus.config.js',
      'website/fetchSupporters.js',
      'website/src/prism/themeLight.js',
      'website/src/prism/themeDark.js',
      'website/babel.config.js',
      'website/i18n.js',
      'website/fetchSupporters.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },

  {
    files: ['website/src/**/*.js', 'examples/**/*.js'],
    languageOptions: {
      parserOptions: {ecmaFeatures: {jsx: true}},
      globals: globals.browser,
    },
  },

  // to make it more suitable for running on code examples in docs/ folder
  {
    files: ['**/*.md/**'],
    languageOptions: {parserOptions: {ecmaFeatures: {jsx: true}}},
    linterOptions: {reportUnusedDisableDirectives: 'off'},
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      'consistent-return': 'off',
      'import-x/export': 'off',
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/no-unresolved': 'off',
      'jest/no-focused-tests': 'off',
      'jest/require-to-throw-message': 'off',
      'no-console': 'off',
      'no-constant-condition': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'sort-keys': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/error-message': 'off',
      'unicorn/no-anonymous-default-export': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-static-only-class': 'off',
      'unicorn/prefer-number-properties': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-global-this': 'off',
      // The following disabled when upgrade ESLint to v9, some of them make sense to enable
      'prefer-template': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import-x/default': 'off',
      'jest/prefer-to-have-length': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/numeric-separators-style': 'off',
    },
  },
  // demonstration of matchers usage
  {
    files: ['**/UsingMatchers.md/**'],
    rules: {
      'jest/prefer-to-be': 'off',
    },
  },
  // demonstration of 'jest/valid-expect' rule
  {
    files: [
      '**/2017-05-06-jest-20-delightful-testing-multi-project-runner.md/**',
    ],
    rules: {
      'jest/valid-expect': 'off',
    },
  },
  // Jest 11 did not had `toHaveLength` matcher
  {
    files: ['**/2016-04-12-jest-11.md/**'],
    rules: {
      'jest/prefer-to-have-length': 'off',
    },
  },
  // snapshot in an example needs to keep escapes
  {
    files: [
      '**/2017-02-21-jest-19-immersive-watch-mode-test-platform-improvements.md/**',
    ],
    rules: {
      'no-useless-escape': 'off',
    },
  },

  // snapshots in examples plus inline snapshots need to keep backtick
  {
    files: ['**/*.md/**', 'e2e/custom-inline-snapshot-matchers/__tests__/*'],
    rules: {
      quotes: [
        'error',
        'single',
        {allowTemplateLiterals: true, avoidEscape: true},
      ],
    },
  },

  {
    files: ['docs/**/*', 'website/**/*'],
    rules: {
      'no-redeclare': 'off',
      'import-x/order': 'off',
      'import-x/sort-keys': 'off',
      'no-restricted-globals': ['off'],
      'sort-keys': 'off',
    },
  },
  {
    files: ['examples/**/*', 'eslint.config.mjs'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['examples/angular/**/*.ts'],
    rules: {
      // Angular DI for some reason doesn't work with type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {prefer: 'no-type-imports', disallowTypeAnnotations: false},
      ],
    },
  },
  {
    files: ['packages/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'import-x/no-anonymous-default-export': [
        'error',
        {
          allowAnonymousClass: false,
          allowAnonymousFunction: false,
          allowArray: false,
          allowArrowFunction: false,
          allowCallExpression: false,
          allowLiteral: false,
          allowObject: true,
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**', '**/__mocks__/**'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/class-literal-property-style': 'off',
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
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prefer-string-raw': 'off',
    },
  },
  {
    files: [
      'packages/jest-jasmine2/src/jasmine/**/*',
      'packages/expect-utils/src/jasmineUtils.ts',
    ],
    rules: {
      '@typescript-eslint/ban-types': 'off',
      '@eslint-community/eslint-comments/disable-enable-pair': 'off',
      '@eslint-community/eslint-comments/no-unlimited-disable': 'off',
      'prefer-rest-params': 'off',
      'prefer-spread': 'off',
      'sort-keys ': 'off',
    },
  },
  {
    files: [
      'e2e/error-on-deprecated/__tests__/*',
      'e2e/jasmine-async/__tests__/*',
    ],
    languageOptions: {
      globals: {
        fail: 'readonly',
        jasmine: 'readonly',
        pending: 'readonly',
      },
    },
  },
  {
    files: [
      'e2e/**',
      'website/**',
      '**/__benchmarks__/**',
      '**/__tests__/**',
      '**/__typetests__/**',
      '.eslintplugin/**',
    ],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/error-message': 'off',
    },
  },
  {
    files: ['**/__typetests__/**'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
    },
  },
  {
    languageOptions: {globals: globals.node},
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
  },
  {
    files: [
      'scripts/*',
      'packages/*/__benchmarks__/test.js',
      'packages/create-jest/src/runCreate.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: [
      'e2e/**',
      'examples/**',
      'website/**',
      '**/__benchmarks__/**',
      '**/__mocks__/**',
      '**/__tests__/**',
      '**/__typetests__/**',
    ],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import-x/no-unresolved': 'off',
      'no-console': 'off',
      'no-unused-vars': 'off',
      'unicorn/no-anonymous-default-export': 'off',
    },
  },
  {
    files: ['scripts/**/*'],
    rules: {
      'unicorn/no-anonymous-default-export': 'off',
    },
  },
  {
    files: ['packages/jest-mock/src/__tests__/**/*'],
    rules: {
      'unicorn/no-static-only-class': 'off',
    },
  },
  {
    files: ['**/*.mjs'],
    rules: {
      'unicorn/prefer-top-level-await': 'error',
    },
  },
  {
    files: [
      'e2e/expect-async-matcher/__tests__/failure.test.js',
      'e2e/expect-async-matcher/__tests__/success.test.js',
      'e2e/transform/babel-jest-async/__tests__/babelJest.test.js',
    ],
    rules: {
      'import-x/namespace': 'off',
      'import-x/default': 'off',
    },
  },
  {
    files: [
      'e2e/coverage-report/__mocks__/sumDependency.js',
      'e2e/require-main-after-create-require/empty.js',
      'packages/create-jest/src/__tests__/__fixtures__/**/*',
      'packages/jest-core/src/__tests__/**/*',
      'packages/jest-haste-map/src/__tests__/test_dotfiles_root/**/*',
      'packages/jest-resolve/src/__mocks__/**/*',
    ],
    rules: {
      'unicorn/no-empty-file': 'off',
    },
  },
  {
    files: ['packages/expect/src/__tests__/*.test.js'],
    rules: {
      'unicorn/prefer-number-properties': 'off',
    },
  },

  {
    ignores: [
      '!.*',
      '**/coverage/**',
      '**/node_modules/**',
      'bin/',
      'packages/*/build/**',
      'packages/*/dist/**',
      'website/.docusaurus',
      'website/build',
      'website/node_modules',
      'website/i18n/*.js',
      'website/static',

      // Third-party script
      'packages/jest-diff/src/cleanupSemantic.ts',
      'e2e/native-esm/wasm-bindgen/index_bg.js',

      '**/.yarn',
      '**/.pnp.*',

      '**/*.snap',
      '**/*.json',

      // JS Syntax error
      '{docs,website/versioned_docs/version-*}/ECMAScriptModules.md',
      '{docs,website/versioned_docs/version-*}/JestObjectAPI.md',

      // Bug? Uses TS syntax
      'e2e/babel-plugin-jest-hoist/__tests__/integration.test.js',
      'e2e/coverage-report/notRequiredInTestSuite.js',
      'e2e/expect-async-matcher/matchers.js',
      'e2e/explicit-resource-management/__tests__/index.js',
      'e2e/failures/__tests__/errorWithCause.test.js',
      'e2e/failures/__tests__/errorWithCauseInDescribe.test.js',
      'e2e/failures/macros.js',
      'e2e/global-setup/invalidSetupWithNamedExport.js',
      'e2e/global-setup/setup.js',
      'e2e/global-setup/setupWithDefaultExport.js',
      'e2e/global-teardown/invalidTeardownWithNamedExport.js',
      'e2e/global-teardown/teardownWithDefaultExport.js',
      'e2e/multi-project-babel/prj-1/index.js',
      'e2e/multi-project-babel/prj-2/index.js',
      'e2e/multi-project-babel/prj-3/src/index.js',
      'e2e/multi-project-babel/prj-4/src/index.js',
      'e2e/multi-project-babel/prj-5/src/index.js',
      'e2e/native-esm/__tests__/native-esm-import-assertions.test.js',
      'e2e/transform-linked-modules/ignored/symlink.js',
      'e2e/global-setup/setupWithDefaultExport.js',
      'e2e/global-setup/setupWithDefaultExport.js',
      'e2e/failures/macros.js',
      'e2e/transform/**/*',
      'examples/react-native/index.js',
    ],
  },
);

export default config;
