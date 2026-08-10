/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import JestHasteMap from 'jest-haste-map';
import {cleanup, writeFiles} from '../Utils';

// Directory must be here for Watchman to be enabled.
const DIR = path.resolve(__dirname, 'haste_map_mock_changed');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('should not warn when a mock file changes', async () => {
  const hasteConfig = {
    computeSha1: false,
    extensions: ['js', 'json', 'png'],
    forceNodeFilesystemAPI: false,
    id: `tmp_${Date.now()}`,
    ignorePattern: / ^/,
    maxWorkers: 2,
    mocksPattern: '__mocks__',
    platforms: [],
    retainAllFiles: false,
    rootDir: DIR,
    roots: [DIR],
    throwOnModuleCollision: true,
    useWatchman: true,
    watch: false,
  };

  // Populate the cache.
  writeFiles(DIR, {
    '__mocks__/fs.js': '"foo fs"',
  });
  await (await JestHasteMap.create(hasteConfig)).build();

  // This will throw if the mock file being updated triggers a warning.
  writeFiles(DIR, {
    '__mocks__/fs.js': '"foo fs!"',
  });
  await (await JestHasteMap.create(hasteConfig)).build();
});
