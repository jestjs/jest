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

const testPath = names => {
  const {addSerializer, getSerializers} = require('../plugins');
  const prev = getSerializers();
  const added = names.map(name =>
    require(require.resolve(`./plugins/${name}`)));

  // Jest tests snapshotSerializers in order preceding built-in serializers.
  // Therefore, add in reverse because the last added is the first tested.
  added.concat().reverse().forEach(serializer => addSerializer(serializer));

  const next = getSerializers();
  expect(next.length).toBe(added.length + prev.length);
  expect(next).toEqual(added.concat(prev));
};

it('gets plugins', () => {
  const {getSerializers} = require('../plugins');
  const plugins = getSerializers();
  expect(plugins.length).toBe(9);
});

it('adds plugins from an empty array', () => testPath([]));
it('adds a single plugin path', () => testPath(['foo']));
it('adds multiple plugin paths', () => testPath(['foo', 'bar']));
