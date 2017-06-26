/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*
* @emails oncall+jsinfra
*/

'use strict';

const logDebugMessages = require('../logDebugMessages');

jest.mock('../../../package.json', () => ({version: 123}));

jest.mock('myRunner', () => ({name: 'My Runner'}), {virtual: true});

const getPipe = () => ({write: jest.fn()});
const print = (
  globalConfig = {watch: true},
  config = {testRunner: 'myRunner'},
) =>
  JSON.stringify(
    {
      config,
      framework: 'My Runner',
      globalConfig,
      version: 123,
    },
    null,
    '  ',
  );

describe('logDebugMessages', () => {
  it('Prints the jest version', () => {
    const pipe = getPipe();
    logDebugMessages({watch: true}, {testRunner: 'myRunner'}, pipe);
    expect(pipe.write).toHaveBeenCalledWith(print() + '\n');
  });

  it('Prints the test framework name', () => {
    const pipe = getPipe();
    logDebugMessages({watch: true}, {testRunner: 'myRunner'}, pipe);
    expect(pipe.write).toHaveBeenCalledWith(print() + '\n');
  });

  it('Prints the config object', () => {
    const pipe = getPipe();
    const globalConfig = {
      automock: false,
      watch: true,
    };
    const config = {
      rootDir: '/path/to/dir',
      roots: ['path/to/dir/test'],
      testRunner: 'myRunner',
    };
    logDebugMessages(globalConfig, config, pipe);
    expect(pipe.write).toHaveBeenCalledWith(print(globalConfig, config) + '\n');
  });
});
