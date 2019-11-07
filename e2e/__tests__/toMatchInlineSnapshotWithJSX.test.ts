/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {
  PackageJson,
  cleanup,
  createEmptyPackage,
  runYarnInstall,
  writeFiles,
} from '../Utils';
import runJest, {json as runWithJson} from '../runJest';

const DIR = path.resolve(tmpdir(), 'to-match-inline-snapshot-with-jsx');

const babelConfig = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-react',
  ],
};

const pkg: PackageJson = {
  dependencies: {
    react: '^17.0.0',
  },
  devDependencies: {
    '@babel/core': '^7.14.4',
    '@babel/preset-env': '^7.14.4',
    '@babel/preset-react': '^7.13.13',
    'react-test-renderer': '^17.0.2',
  },
  jest: {
    testEnvironment: 'jsdom',
  },
};

beforeEach(() => {
  cleanup(DIR);

  createEmptyPackage(DIR, pkg);

  writeFiles(DIR, {
    '__tests__/MismatchingSnapshot.test.js': `
      import React from 'react';
      import renderer from 'react-test-renderer';

      test('<div>x</div>', () => {
        expect(renderer.create(<div>x</div>).toJSON()).toMatchInlineSnapshot(\`
          <div>
            y
          </div>
        \`);
      });`,
  });

  runYarnInstall(DIR, {
    YARN_ENABLE_GLOBAL_CACHE: 'true',
    YARN_NODE_LINKER: 'node-modules',
  });
});

afterAll(() => {
  cleanup(DIR);
});

it('successfully runs the tests with external babel config', () => {
  writeFiles(DIR, {
    'babel.config.js': `module.exports = ${JSON.stringify(babelConfig)};`,
  });

  const normalRun = runWithJson(DIR, []);
  expect(normalRun.exitCode).toBe(1);
  expect(normalRun.stderr).toContain('1 snapshot failed from 1 test suite.');
  expect(normalRun.json.testResults[0].message).toMatchInlineSnapshot(`
    "  ● <div>x</div>

        expect(received).toMatchInlineSnapshot(snapshot)

        Snapshot name: \`<div>x</div> 1\`

        - Snapshot  - 1
        + Received  + 1

          <div>
        -   y
        +   x
          </div>

          3 |
          4 | test('<div>x</div>', () => {
        > 5 |   expect(renderer.create(<div>x</div>).toJSON()).toMatchInlineSnapshot(\`
            |                                                  ^
          6 |     <div>
          7 |       y
          8 |     </div>

          at Object.<anonymous> (__tests__/MismatchingSnapshot.test.js:5:50)
    "
  `);

  const updateSnapshotRun = runJest(DIR, ['--updateSnapshot']);

  expect(updateSnapshotRun.exitCode).toBe(0);
  expect(updateSnapshotRun.stderr).toContain('1 snapshot updated.');
});

it('successfully runs the tests with inline babel config', () => {
  writeFiles(DIR, {
    'package.json': JSON.stringify({
      ...pkg,
      jest: {
        testEnvironment: 'jsdom',
        transform: {
          '^.+\\.(js|jsx)$': ['babel-jest', babelConfig],
        },
      },
    }),
  });

  const normalRun = runWithJson(DIR, []);
  expect(normalRun.exitCode).toBe(1);
  expect(normalRun.stderr).toContain('1 snapshot failed from 1 test suite.');
  expect(normalRun.json.testResults[0].message).toMatchInlineSnapshot(`
    "  ● <div>x</div>

        expect(received).toMatchInlineSnapshot(snapshot)

        Snapshot name: \`<div>x</div> 1\`

        - Snapshot  - 1
        + Received  + 1

          <div>
        -   y
        +   x
          </div>

          3 |
          4 | test('<div>x</div>', () => {
        > 5 |   expect(renderer.create(<div>x</div>).toJSON()).toMatchInlineSnapshot(\`
            |                                                  ^
          6 |     <div>
          7 |       y
          8 |     </div>

          at Object.<anonymous> (__tests__/MismatchingSnapshot.test.js:5:50)
    "
  `);

  const updateSnapshotRun = runJest(DIR, ['--updateSnapshot']);

  expect(updateSnapshotRun.exitCode).toBe(0);
  expect(updateSnapshotRun.stderr).toContain('1 snapshot updated.');
});
