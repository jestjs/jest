/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

beforeEach(() => jest.resetModules());

const testPath = serializers => {
  const {addPlugins, getPlugins} = require('../plugins');
  const serializerPaths = serializers.map(s =>
    require.resolve(`./plugins/${s}`),
  );
  addPlugins(serializerPaths);
  const expected = serializerPaths.map(p => require(p));

  const plugins = getPlugins();
  expect(plugins.length).toBe(serializers.length + 2);
  plugins.splice(0, 2);
  expect(plugins).toEqual(expected);
};

it('gets plugins', () => {
  const {getPlugins} = require('../plugins');
  const plugins = getPlugins();
  expect(plugins.length).toBe(2);
});

it('adds plugins from an empty array', () => testPath([]));
it('adds a single plugin path', () =>  testPath(['foo']));
it('adds multiple plugin paths', () => testPath(['foo', 'bar']));
