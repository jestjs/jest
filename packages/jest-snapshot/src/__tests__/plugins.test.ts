/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Plugin} from 'pretty-format';

beforeEach(() => {
  jest.resetModules();
});

const testPath = (names: Array<string>) => {
  const {addSerializer, getSerializers} =
    require('../plugins') as typeof import('../plugins');
  const prev = getSerializers();
  const added = names.map(
    name => require(require.resolve(`./plugins/${name}`)) as Plugin,
  );

  // Jest tests snapshotSerializers in order preceding built-in serializers.
  // Therefore, add in reverse because the last added is the first tested.
  added
    .concat()
    .reverse()
    .forEach(serializer => addSerializer(serializer));

  const next = getSerializers();
  expect(next).toHaveLength(added.length + prev.length);
  expect(next).toEqual(added.concat(prev));
};

it('gets plugins', () => {
  const {getSerializers} = require('../plugins') as typeof import('../plugins');
  const plugins = getSerializers();
  expect(plugins).toHaveLength(5);
});

it('adds plugins from an empty array', () => testPath([]));
it('adds a single plugin path', () => testPath(['foo']));
it('adds multiple plugin paths', () => testPath(['foo', 'bar']));
