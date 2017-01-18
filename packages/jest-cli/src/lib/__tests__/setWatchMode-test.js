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

const setWatchMode = require('../setWatchMode');

describe('setWatchMode()', () => {
  it('Sets watch and watchAll flags based on the mode', () => {
    let argv = {};
    setWatchMode(argv, 'watch', {});
    expect(argv.watch).toBeTruthy();
    expect(argv.watchAll).toBeFalsy();

    argv = {};
    setWatchMode(argv, 'watchAll', {});
    expect(argv.watch).toBeFalsy();
    expect(argv.watchAll).toBeTruthy();
  });

  it('Sets the onlyChanged flag then in watch and with no pattern', () => {
    let argv = {};
    setWatchMode(argv, 'watch', {});
    expect(argv.onlyChanged).toBeTruthy();

    argv = {testPathPattern: 'jest-cli'};
    setWatchMode(argv, 'watch', {});
    expect(argv.onlyChanged).toBeFalsy();

    argv = {};
    setWatchMode(argv, 'watchAll', {});
    expect(argv.onlyChanged).toBeFalsy();
  });

  it('Sets the noSCM flag when the options specify it', () => {
    let argv = {};
    setWatchMode(argv, 'watch', {noSCM: true});
    expect(argv.noSCM).toBeTruthy();

    argv = {};
    setWatchMode(argv, 'watch', {noSCM: false});
    expect(argv.noSCM).toBeFalsy();
  });
});
