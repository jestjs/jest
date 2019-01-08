/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import isValidPath from '../is_valid_path';
import path from 'path';
import {makeGlobalConfig, makeProjectConfig} from '../../../../../TestUtils';

const rootDir = path.resolve(path.sep, 'root');

const config = makeProjectConfig({
  rootDir,
  roots: [path.resolve(rootDir, 'src'), path.resolve(rootDir, 'lib')],
  watchPathIgnorePatterns: ['pacts'],
});

it('is valid when it is a file inside roots', () => {
  expect(
    isValidPath(
      makeGlobalConfig(),
      config,
      path.resolve(rootDir, 'src', 'index.js'),
    ),
  ).toBe(true);
  expect(
    isValidPath(
      makeGlobalConfig(),
      config,
      path.resolve(rootDir, 'src', 'components', 'Link.js'),
    ),
  ).toBe(true);
  expect(
    isValidPath(
      makeGlobalConfig(),
      config,
      path.resolve(rootDir, 'src', 'lib', 'something.js'),
    ),
  ).toBe(true);
});

it('is not valid when it is a snapshot file', () => {
  expect(
    isValidPath(
      makeGlobalConfig(),
      config,
      path.resolve(rootDir, 'src', 'index.js.snap'),
    ),
  ).toBe(false);
  expect(
    isValidPath(
      makeGlobalConfig(),
      config,
      path.resolve(rootDir, 'src', 'components', 'Link.js.snap'),
    ),
  ).toBe(false);
  expect(
    isValidPath(
      makeGlobalConfig(),
      config,
      path.resolve(rootDir, 'src', 'lib', 'something.js.snap'),
    ),
  ).toBe(false);
});

it('is not valid when it is a file in the coverage dir', () => {
  expect(
    isValidPath(
      makeGlobalConfig({rootDir}),
      config,
      path.resolve(rootDir, 'coverage', 'lib', 'index.js'),
    ),
  ).toBe(false);

  expect(
    isValidPath(
      makeGlobalConfig({coverageDirectory: 'cov-dir'}),
      config,
      path.resolve(rootDir, 'src', 'cov-dir', 'lib', 'index.js'),
    ),
  ).toBe(false);
});

it('is not valid when it is a file match one of the watchPathIgnorePatterns', () => {
  expect(
    isValidPath(
      makeGlobalConfig({rootDir}),
      config,
      path.resolve(rootDir, 'pacts', 'todoapp-todoservice.json'),
    ),
  ).toBe(false);
});
