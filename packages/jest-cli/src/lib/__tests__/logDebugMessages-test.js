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
const print = (config = {testRunner: 'myRunner'}) =>
  JSON.stringify(
    {
      config,
      framework: 'My Runner',
      version: 123,
    },
    null,
    '  ',
  );

describe('logDebugMessages', () => {
  it('Prints the jest version', () => {
    const pipe = getPipe();
    logDebugMessages({testRunner: 'myRunner'}, pipe);
    expect(pipe.write).toHaveBeenCalledWith(print() + '\n');
  });

  it('Prints the test framework name', () => {
    const pipe = getPipe();
    logDebugMessages({testRunner: 'myRunner'}, pipe);
    expect(pipe.write).toHaveBeenCalledWith(print() + '\n');
  });

  it('Prints the config object', () => {
    const pipe = getPipe();
    const config = {
      automock: false,
      rootDir: '/path/to/dir',
      roots: ['path/to/dir/test'],
      testRunner: 'myRunner',
      watch: true,
    };
    logDebugMessages(config, pipe);
    expect(pipe.write).toHaveBeenCalledWith(print(config) + '\n');
  });
});
