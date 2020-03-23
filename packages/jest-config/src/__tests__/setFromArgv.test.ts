/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Config} from '@jest/types';
import setFromArgv from '../setFromArgv';

test('maps special values to valid options', () => {
  const options = {} as Config.InitialOptions;
  const argv = {
    coverage: true,
    env: 'node',
    json: true,
    watchAll: true,
  } as Config.Argv;

  expect(setFromArgv(options, argv)).toMatchObject({
    collectCoverage: true,
    testEnvironment: 'node',
    useStderr: true,
    watch: false,
    watchAll: true,
  });
});

test('maps regular values to themselves', () => {
  const options = {} as Config.InitialOptions;
  const argv = {
    collectCoverageOnlyFrom: ['a', 'b'],
    coverageDirectory: 'covDir',
    watchman: true,
  } as Config.Argv;

  expect(setFromArgv(options, argv)).toMatchObject({
    collectCoverageOnlyFrom: ['a', 'b'],
    coverageDirectory: 'covDir',
    watchman: true,
  });
});

test('works with string objects', () => {
  const options = {} as Config.InitialOptions;
  const argv = {
    moduleNameMapper:
      '{"types/(.*)": "<rootDir>/src/types/$1", "types2/(.*)": ["<rootDir>/src/types2/$1", "<rootDir>/src/types3/$1"]}',
    transform: '{"*.js": "<rootDir>/transformer"}',
  } as Config.Argv;
  expect(setFromArgv(options, argv)).toMatchObject({
    moduleNameMapper: {
      'types/(.*)': '<rootDir>/src/types/$1',
      'types2/(.*)': ['<rootDir>/src/types2/$1', '<rootDir>/src/types3/$1'],
    },
    transform: {
      '*.js': '<rootDir>/transformer',
    },
  });
});

test('explicit flags override those from --config', () => {
  const options = {} as Config.InitialOptions;
  const argv = {
    config: '{"watch": false}',
    watch: true,
  } as Config.Argv;
  expect(setFromArgv(options, argv)).toMatchObject({watch: true});
});
