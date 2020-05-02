/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Resolver = require('jest-resolve');
import {tmpdir} from 'os';
import * as path from 'path';
import type {Config} from '@jest/types';
import {buildSnapshotResolver} from 'jest-snapshot';
import {makeProjectConfig} from '../../../../TestUtils';

import DependencyResolver from '../index';

const maxWorkers = 1;
let dependencyResolver: DependencyResolver;
let runtimeContextResolver: Resolver;
let Runtime;
let config: Config.ProjectConfig;
const cases: Record<string, jest.Mock> = {
  fancyCondition: jest.fn(path => path.length > 10),
  testRegex: jest.fn(path => /.test.js$/.test(path)),
};
const filter = (path: Config.Path) =>
  Object.keys(cases).every(key => cases[key](path));

beforeEach(() => {
  Runtime = require('jest-runtime');
  config = makeProjectConfig({
    cacheDirectory: path.resolve(tmpdir(), 'jest-resolve-dependencies-test'),
    moduleDirectories: ['node_modules'],
    moduleNameMapper: [['^\\$asdf/(.*)$', '<rootDir>/$1']],
    rootDir: '.',
    roots: ['./packages/jest-resolve-dependencies'],
  });
  return Runtime.createContext(config, {maxWorkers, watchman: false}).then(
    (runtimeContext: any) => {
      runtimeContextResolver = runtimeContext.resolver;
      dependencyResolver = new DependencyResolver(
        runtimeContext.resolver,
        runtimeContext.hasteFS,
        buildSnapshotResolver(config),
      );
    },
  );
});

test('resolves no dependencies for non-existent path', () => {
  const resolved = dependencyResolver.resolve('/non/existent/path');
  expect(resolved.length).toEqual(0);
});

test('resolves dependencies for existing path', () => {
  const resolved = dependencyResolver.resolve(
    path.resolve(__dirname, '__fixtures__', 'file.js'),
  );
  expect(resolved).toEqual([
    expect.stringContaining('jest-resolve-dependencies'),
    expect.stringContaining('jest-regex-util'),
  ]);
});

test('resolves dependencies for scoped packages', () => {
  const resolved = dependencyResolver.resolve(
    path.resolve(__dirname, '__fixtures__', 'scoped.js'),
  );
  expect(resolved).toEqual([
    expect.stringContaining(path.join('@myorg', 'pkg')),
  ]);
});

test('resolves no inverse dependencies for empty paths set', () => {
  const paths = new Set();
  const resolved = dependencyResolver.resolveInverse(paths, filter);
  expect(resolved.length).toEqual(0);
});

test('resolves no inverse dependencies for set of non-existent paths', () => {
  const paths = new Set(['/non/existent/path', '/another/one']);
  const resolved = dependencyResolver.resolveInverse(paths, filter);
  expect(resolved.length).toEqual(0);
});

test('resolves inverse dependencies for existing path', () => {
  const paths = new Set([path.resolve(__dirname, '__fixtures__/file.js')]);
  const resolved = dependencyResolver.resolveInverse(paths, filter);
  expect(resolved).toEqual([
    expect.stringContaining(
      path.join('__tests__', '__fixtures__', 'file.test.js'),
    ),
  ]);
});

test('resolves inverse dependencies from available snapshot', () => {
  const paths = new Set([
    path.resolve(__dirname, '__fixtures__/file.js'),
    path.resolve(__dirname, '__fixtures__/__snapshots__/related.test.js.snap'),
  ]);
  const resolved = dependencyResolver.resolveInverse(paths, filter);
  expect(resolved).toEqual(
    expect.arrayContaining([
      expect.stringContaining(
        path.join('__tests__', '__fixtures__', 'file.test.js'),
      ),
      expect.stringContaining(
        path.join('__tests__', '__fixtures__', 'related.test.js'),
      ),
    ]),
  );
});

test('resolves dependencies correctly when dependency resolution fails', () => {
  jest.spyOn(runtimeContextResolver, 'resolveModule').mockImplementation(() => {
    throw new Error('resolveModule has failed');
  });
  jest.spyOn(runtimeContextResolver, 'getMockModule').mockImplementation(() => {
    throw new Error('getMockModule has failed');
  });

  const resolved = dependencyResolver.resolve(
    path.resolve(__dirname, '__fixtures__', 'file.test.js'),
  );

  expect(resolved).toEqual([]);
});
