/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {realpathSync} from 'graceful-fs';
import HasteMap from 'jest-haste-map';
import {cleanup, writeFiles} from '../Utils';

const DIR = path.resolve(realpathSync.native(tmpdir()), 'haste_map_size');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {
    'file.js': '"abc"',
  });
});
afterEach(() => cleanup(DIR));

const options = {
  extensions: ['js'],
  forceNodeFilesystemAPI: true,
  id: 'tmp',
  ignorePattern: / ^/,
  maxWorkers: 2,
  mocksPattern: '',
  platforms: [],
  retainAllFiles: true,
  rootDir: DIR,
  roots: [DIR],
  useWatchman: false,
  watch: false,
};

test('reports the correct file size', async () => {
  const hasteMap = await HasteMap.create(options);
  const hasteFS = (await hasteMap.build()).hasteFS;
  expect(hasteFS.getSize(path.join(DIR, 'file.js'))).toBe(5);
});

test('updates the file size when a file changes', async () => {
  const hasteMap = await HasteMap.create({...options, watch: true});
  await hasteMap.build();

  writeFiles(DIR, {
    'file.js': '"asdf"',
  });
  const {hasteFS} = await new Promise(resolve =>
    hasteMap.once('change', resolve),
  );
  hasteMap.end();
  expect(hasteFS.getSize(path.join(DIR, 'file.js'))).toBe(6);
});
