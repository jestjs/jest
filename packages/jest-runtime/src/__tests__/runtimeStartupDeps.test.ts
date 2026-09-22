/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {spawnSync} from 'child_process';
import {readFileSync} from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(
  path.dirname(require.resolve('jest-runtime/package.json')),
  '..',
  '..',
);

test('requiring jest-runtime does not load babel or InlineSnapshots', () => {
  // Runs in a fresh Node process: this repo's own Jest run already has
  // `@babel/*` loaded via `babel-jest`, so `require.cache` can only be
  // inspected meaningfully outside of it.
  const {status, stdout, stderr} = spawnSync(
    process.execPath,
    [
      '-e',
      `
        const Runtime = require(process.argv[1]).default;
        // The replacement dependency must stay light as well.
        require(process.argv[2]);
        // Stub out the real haste map build (it would crawl the filesystem);
        // we only care which modules get loaded while its options are
        // evaluated -- notably the \`extensions\` list holding the snapshot
        // extension constant.
        require('jest-haste-map').default.create = () => Promise.resolve({});
        Runtime.createHasteMap({
          cacheDirectory: '/tmp/fake-jest-cache',
          haste: {},
          id: 'startup-deps-probe',
          moduleFileExtensions: ['js', 'json'],
          modulePathIgnorePatterns: [],
          rootDir: '/tmp/fake-jest-root',
          roots: ['/tmp/fake-jest-root'],
        }).then(() => {
          const loaded = Object.keys(require.cache).map(key =>
            key.replaceAll('\\\\', '/'),
          );
          console.log(
            JSON.stringify(
              loaded.filter(
                key =>
                  key.includes('InlineSnapshots') || key.includes('@babel/'),
              ),
            ),
          );
        });
      `,
      require.resolve('jest-runtime'),
      require.resolve('@jest/snapshot-utils'),
    ],
    {cwd: repoRoot, encoding: 'utf8'},
  );

  expect(stderr).toBe('');
  expect(status).toBe(0);
  expect(JSON.parse(stdout)).toEqual([]);
});

test('jest-runtime resolves the snapshot extension without jest-snapshot', () => {
  // Regression test for https://github.com/jestjs/jest/issues/13842:
  // `jest-runtime` imported the `EXTENSION` constant from the babel-heavy
  // `jest-snapshot` package, so building the haste map (which every Jest run
  // does) pulled in `@babel/*` and `InlineSnapshots` for a mere `'snap'`
  // string. The constant now lives in the dependency-free
  // `@jest/snapshot-utils` package instead, and `jest-runtime` must not
  // depend on `jest-snapshot` anymore.
  const source = readFileSync(
    path.join(repoRoot, 'packages/jest-runtime/src/index.ts'),
    'utf8',
  );

  expect(source).toContain("from '@jest/snapshot-utils'");
  expect(source).not.toContain("from 'jest-snapshot'");

  const packageJson = JSON.parse(
    readFileSync(
      path.join(repoRoot, 'packages/jest-runtime/package.json'),
      'utf8',
    ),
  ) as {dependencies: Record<string, string>};

  expect(packageJson.dependencies['@jest/snapshot-utils']).toBeDefined();
  expect(packageJson.dependencies['jest-snapshot']).toBeUndefined();
});
