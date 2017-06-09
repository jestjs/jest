/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {DefaultOptions} from 'types/Config';

import os from 'os';
import path from 'path';
import {replacePathSepForRegex} from 'jest-regex-util';
import constants from './constants';

const NODE_MODULES_REGEXP = replacePathSepForRegex(constants.NODE_MODULES);

const cacheDirectory = (() => {
  const {getuid} = process;
  if (getuid == null) {
    return path.join(os.tmpdir(), 'jest');
  }
  // On some platforms tmpdir() is `/tmp`, causing conflicts between different
  // users and permission issues. Adding an additional subdivision by UID can
  // help.
  return path.join(os.tmpdir(), 'jest_' + getuid.call(process).toString(36));
})();

module.exports = ({
  automock: false,
  bail: false,
  browser: false,
  cache: true,
  cacheDirectory,
  clearMocks: false,
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  expand: false,
  globals: {},
  haste: {
    providesModuleNodeModules: [],
  },
  mapCoverage: false,
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  moduleNameMapper: {},
  modulePathIgnorePatterns: [],
  noStackTrace: false,
  notify: false,
  preset: null,
  resetMocks: false,
  resetModules: false,
  snapshotSerializers: [],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)(spec|test).js?(x)'],
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: '',
  testResultsProcessor: null,
  testURL: 'about:blank',
  timers: 'real',
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  useStderr: false,
  verbose: null,
  watch: false,
  watchman: true,
}: DefaultOptions);
