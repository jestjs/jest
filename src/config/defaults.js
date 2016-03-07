'use strict';

const path = require('path');
const utils = require('jest-util');

module.exports = {
  automock: true,
  bail: false,
  cacheDirectory: path.resolve(__dirname, '..', '..', '.haste_cache'),
  coverageCollector: require.resolve('../IstanbulCollector'),
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  globals: {},
  moduleFileExtensions: ['js', 'json', 'node'],
  moduleLoader: require.resolve('../HasteModuleLoader/HasteModuleLoader'),
  moduleResolver: require.resolve('../resolvers/HasteResolver'),
  haste: {
    providesModuleNodeModules: [],
  },
  setupFiles: [],
  preprocessorIgnorePatterns: [],
  modulePathIgnorePatterns: [],
  moduleNameMapper: [],
  testDirectoryName: '__tests__',
  mocksPattern: '__mocks__',
  testEnvironment: require.resolve('../environments/JSDOMEnvironment'),
  testEnvData: {},
  testFileExtensions: ['js'],
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: [utils.replacePathSepForRegex('/node_modules/')],
  testReporter: require.resolve('../reporters/IstanbulTestReporter'),
  testURL: 'about:blank',
  noHighlight: false,
  noStackTrace: false,
  preprocessCachingDisabled: false,
  verbose: false,
  useStderr: false,
};
