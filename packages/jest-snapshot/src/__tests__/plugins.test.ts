/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {makeProjectConfig} from '@jest/test-utils';
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
  for (const serializer of [...added].reverse()) addSerializer(serializer);

  const next = getSerializers();
  expect(next).toHaveLength(added.length + prev.length);
  expect(next).toEqual([...added, ...prev]);
};

it('gets plugins', () => {
  const {getSerializers} = require('../plugins') as typeof import('../plugins');
  const plugins = getSerializers();
  expect(plugins).toHaveLength(7);
});

it('adds plugins from an empty array', () => testPath([]));
it('adds a single plugin path', () => testPath(['foo']));
it('adds multiple plugin paths', () => testPath(['foo', 'bar']));

describe('loadSerializersFromConfig', () => {
  const pluginPath = (name: string) => path.resolve(__dirname, 'plugins', name);

  const load = (snapshotSerializers: Array<string>) => {
    const {loadSerializersFromConfig} =
      require('../plugins') as typeof import('../plugins');

    return loadSerializersFromConfig(
      makeProjectConfig({rootDir: __dirname, snapshotSerializers}),
    );
  };

  it('returns an empty array when no serializer is configured', async () => {
    await expect(load([])).resolves.toEqual([]);
  });

  it('loads serializers in reverse order for prepending', async () => {
    const serializers = await load([
      pluginPath('foo.js'),
      pluginPath('bar.js'),
    ]);

    expect(serializers).toEqual([
      require(pluginPath('bar.js')),
      require(pluginPath('foo.js')),
    ]);
  });

  it('loads the default export from a serializer module', async () => {
    const serializers = await load([pluginPath('default.js')]);

    expect(serializers).toEqual([require(pluginPath('default.js')).default]);
  });
});
