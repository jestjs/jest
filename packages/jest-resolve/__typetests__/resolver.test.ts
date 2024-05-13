/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import type {
  AsyncResolver,
  JestResolver,
  PackageFilter,
  PackageJSON,
  PathFilter,
  ResolverOptions,
  SyncResolver,
} from 'jest-resolve';

// PackageJSON

expect<PackageJSON>().type.toBeAssignable({
  caption: 'test',
  count: 100,
  isTest: true,
  location: {name: 'test', start: [1, 2], valid: false, x: 10, y: 20},
  values: [0, 10, 20, {x: 1, y: 2}, true, 'test', ['a', 'b']],
});

expect<PackageJSON>().type.not.toBeAssignable({
  filter: () => {},
});

// PackageFilter

const packageFilter = (pkg: PackageJSON, file: string, dir: string) => pkg;

expect<PackageFilter>().type.toBeAssignable(packageFilter);

// PathFilter

const pathFilter = (pkg: PackageJSON, path: string, relativePath: string) =>
  relativePath;

expect<PathFilter>().type.toBeAssignable(pathFilter);

// ResolverOptions

function customSyncResolver(path: string, options: ResolverOptions): string {
  return path;
}
expect<SyncResolver>().type.toBeAssignable(customSyncResolver);

async function customAsyncResolver(
  path: string,
  options: ResolverOptions,
): Promise<string> {
  return path;
}
expect<AsyncResolver>().type.toBeAssignable(customAsyncResolver);

// AsyncResolver

const asyncResolver: AsyncResolver = async (path, options) => {
  expect(path).type.toBeString();

  expect(options.basedir).type.toBeString();
  expect(options.conditions).type.toEqual<Array<string> | undefined>();
  expect(options.defaultResolver).type.toEqual<SyncResolver>();
  expect(options.extensions).type.toEqual<Array<string> | undefined>();
  expect(options.moduleDirectory).type.toEqual<Array<string> | undefined>();
  expect(options.packageFilter).type.toEqual<PackageFilter | undefined>();
  expect(options.pathFilter).type.toEqual<PathFilter | undefined>();
  expect(options.paths).type.toEqual<Array<string> | undefined>();
  expect(options.rootDir).type.toEqual<string | undefined>();

  return path;
};

const notReturningAsyncResolver = async () => {};
expect<AsyncResolver>().type.not.toBeAssignable(notReturningAsyncResolver());

// SyncResolver

const syncResolver: SyncResolver = (path, options) => {
  expect(path).type.toBeString();

  expect(options.basedir).type.toBeString();
  expect(options.conditions).type.toEqual<Array<string> | undefined>();
  expect(options.defaultResolver).type.toEqual<SyncResolver>();
  expect(options.extensions).type.toEqual<Array<string> | undefined>();
  expect(options.moduleDirectory).type.toEqual<Array<string> | undefined>();
  expect(options.packageFilter).type.toEqual<PackageFilter | undefined>();
  expect(options.pathFilter).type.toEqual<PathFilter | undefined>();
  expect(options.paths).type.toEqual<Array<string> | undefined>();
  expect(options.rootDir).type.toEqual<string | undefined>();

  return path;
};

const notReturningSyncResolver = () => {};
expect<SyncResolver>().type.not.toBeAssignable(notReturningSyncResolver());

// JestResolver

expect<JestResolver>().type.toBeAssignable({async: asyncResolver});
expect<JestResolver>().type.toBeAssignable({sync: syncResolver});
expect<JestResolver>().type.toBeAssignable({
  async: asyncResolver,
  sync: syncResolver,
});
expect<JestResolver>().type.not.toBeAssignable({});
