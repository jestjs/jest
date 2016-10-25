/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

describe('addPlugins', () => {
  const setup = require('../setup-jest-globals');

  beforeEach(() => {
    require('jest-snapshot').__reset();
  });

  const test = serializers => {
    const {getPlugins} = require('jest-snapshot');
    const config = {
      snapshotSerializers: [],
    };
    setup({config});
    expect(getPlugins()).toEqual(config.snapshotSerializers);
  };

  it('should add plugins from an empty array', () => test([]));
  it('should add a single plugin', () =>  test(['foo']));
  it('should add multiple plugins', () => test(['foo', 'bar']));
});
