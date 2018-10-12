/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const Runtime = require('..');

it('returns the same Haste instance if parameters are the same', () => {
  jest.mock('jest-haste-map');

  const hasteConfig = {
    cacheDirectory: '/foo/bar/baz',
    haste: {
      hasteImplModulePath: '/haste/impl/module/path.js',
      providesModuleNodeModules: ['react', 'react-native'],
    },
    moduleFileExtensions: ['js', 'json', 're'],
    roots: ['/foo', '/bar'],
  };

  const hasteOptions = {
    maxWorkers: 314,
    resetCache: true,
    watch: false,
    watchman: true,
  };

  const hasteOptionsChanged = {
    maxWorkers: 314,
    resetCache: false,
    watch: false,
    watchman: true,
  };

  const hasteMap1 = Runtime.createHasteMap(hasteConfig, hasteOptions);
  const hasteMap2 = Runtime.createHasteMap(hasteConfig, hasteOptions);
  const hasteMap3 = Runtime.createHasteMap(hasteConfig, hasteOptionsChanged);

  // We use "toBe" instead of "toEqual" to check that the instance is the same.
  expect(hasteMap1).toBe(hasteMap2);

  expect(hasteMap1).not.toBe(hasteMap3);
  expect(hasteMap2).not.toBe(hasteMap3);
});
