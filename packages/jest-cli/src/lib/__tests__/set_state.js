/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const setState = require('../setState');

describe('setState()', () => {
  it('Sets watch and watchAll flags based on the mode', () => {
    let argv = {};
    setState(argv, 'watch', {});
    expect(argv.watch).toBeTruthy();
    expect(argv.watchAll).toBeFalsy();

    argv = {};
    setState(argv, 'watchAll', {});
    expect(argv.watch).toBeFalsy();
    expect(argv.watchAll).toBeTruthy();
  });

  it('Sets the onlyChanged flag then in watch and with no pattern', () => {
    let argv = {};
    setState(argv, 'watch', {});
    expect(argv.onlyChanged).toBeTruthy();

    argv = {testPathPattern: 'jest-cli'};
    setState(argv, 'watch', {});
    expect(argv.onlyChanged).toBeFalsy();

    argv = {testNamePattern: 'name-test'};
    setState(argv, 'watch', {});
    expect(argv.onlyChanged).toBeFalsy();

    argv = {};
    setState(argv, 'watchAll', {});
    expect(argv.onlyChanged).toBeFalsy();
  });

  it('Sets the noSCM flag when the options specify it', () => {
    let argv = {};
    setState(argv, 'watch', {noSCM: true});
    expect(argv.noSCM).toBeTruthy();

    argv = {};
    setState(argv, 'watch', {noSCM: false});
    expect(argv.noSCM).toBeFalsy();
  });
});
