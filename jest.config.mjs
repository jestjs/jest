/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';
const require = createRequire(import.meta.url);

/** @type {import('jest').Config} */
export default {
  collectCoverageFrom: [
    '**/packages/*/**/*.js',
    '**/packages/*/**/*.ts',
    '!**/bin/**',
    '!**/cli/**',
    '!**/__benchmarks__/**',
    '!**/__mocks__/**',
    '!**/__tests__/**',
    '!**/__typetests__/**',
    '!**/build/**',
    '!**/vendor/**',
    '!e2e/**',
  ],
  modulePathIgnorePatterns: [
    'examples/.*',
    'packages/.*/build',
    'packages/.*/tsconfig.*',
    'packages/jest-runtime/src/__tests__/test_root.*',
    'website/.*',
    'e2e/runtime-internal-module-registry/__mocks__',
  ],
  projects: ['<rootDir>', '<rootDir>/examples/*/'],
  snapshotFormat: {
    printBasicPrototype: true,
  },
  snapshotSerializers: [require.resolve('jest-serializer-ansi-escapes')],
  testPathIgnorePatterns: [
    '/__arbitraries__/',
    '/__benchmarks__/',
    '/__fixtures__/',
    '/__typetests__/',
    '/node_modules/',
    '/examples/',
    '/e2e/.*/__tests__',
    '/e2e/global-setup',
    '/e2e/global-teardown',
    '/e2e/custom-*',
    '/e2e/test-in-root',
    '/e2e/run-programmatically-multiple-projects',
    '/e2e/multi-project-babel',
    '\\.snap$',
    '/packages/.*/build',
    '/packages/.*/src/__tests__/setPrettyPrint.ts',
    '/packages/jest-core/src/__tests__/test_root',
    '/packages/jest-haste-map/src/__tests__/haste_impl.js',
    '/packages/jest-haste-map/src/__tests__/dependencyExtractor.js',
    '/packages/jest-haste-map/src/__tests__/test_dotfiles_root/',
    '/packages/jest-repl/src/__tests__/test_root',
    '/packages/jest-runtime/src/__tests__/defaultResolver.js',
    '/packages/jest-runtime/src/__tests__/module_dir/',
    '/packages/jest-runtime/src/__tests__/NODE_PATH_dir',
    '/packages/jest-snapshot/src/__tests__/plugins',
    '/packages/jest-snapshot/src/__tests__/fixtures/',
    '/e2e/__tests__/iterator-to-null-test.ts',
    '/e2e/__tests__/tsIntegration.test.ts', // this test needs types to be build, it runs in a separate CI job through `jest.config.ts.mjs`
  ],
  testTimeout: 70000,
  transform: {
    '\\.[jt]sx?$': require.resolve('babel-jest'),
  },
  watchPathIgnorePatterns: [
    'coverage',
    '<rootDir>/packages/jest-worker/src/workers/__tests__/__temp__',
  ],
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
};
