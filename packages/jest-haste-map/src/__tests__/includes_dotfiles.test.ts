/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import HasteMap from '../index';

const rootDir = path.join(__dirname, './test_dotfiles_root');

const commonOptions = {
  extensions: ['js'],
  maxWorkers: 1,
  platforms: [],
  resetCache: true,
  retainAllFiles: true,
  rootDir,
  roots: [rootDir],
};

test('watchman crawler and node crawler both include dotfiles', async () => {
  const hasteMapWithWatchman = await HasteMap.create({
    ...commonOptions,
    id: 'withWatchman',
    useWatchman: true,
  });

  const hasteMapWithNode = await HasteMap.create({
    ...commonOptions,
    id: 'withNode',
    useWatchman: false,
  });

  const [builtHasteMapWithWatchman, builtHasteMapWithNode] = await Promise.all([
    hasteMapWithWatchman.build(),
    hasteMapWithNode.build(),
  ]);

  expect(
    builtHasteMapWithWatchman.hasteFS.matchFiles('.eslintrc.js'),
  ).toHaveLength(1);

  expect(builtHasteMapWithWatchman.hasteFS.getAllFiles().sort()).toEqual(
    builtHasteMapWithNode.hasteFS.getAllFiles().sort(),
  );
});
