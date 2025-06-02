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
  PackageJSON,
  ResolverOptions,
  SyncResolver,
} from 'jest-resolve';

// PackageJSON

expect<PackageJSON>().type.toBeAssignableWith({
  caption: 'test',
  count: 100,
  isTest: true,
  location: {name: 'test', start: [1, 2], valid: false, x: 10, y: 20},
  values: [0, 10, 20, {x: 1, y: 2}, true, 'test', ['a', 'b']],
});

expect<PackageJSON>().type.not.toBeAssignableWith({
  filter: () => {},
});

// ResolverOptions

function customSyncResolver(path: string, options: ResolverOptions): string {
  return path;
}
expect<SyncResolver>().type.toBeAssignableWith(customSyncResolver);

async function customAsyncResolver(
  path: string,
  options: ResolverOptions,
): Promise<string> {
  return path;
}
expect<AsyncResolver>().type.toBeAssignableWith(customAsyncResolver);

// AsyncResolver

const asyncResolver: AsyncResolver = async (path, options) => {
  expect(path).type.toBe<string>();

  expect(options.basedir).type.toBe<string>();
  expect(options.conditions).type.toBe<Array<string> | undefined>();
  expect(options.defaultResolver).type.toBe<SyncResolver>();
  expect(options.extensions).type.toBe<Array<string> | undefined>();
  expect(options.moduleDirectory).type.toBe<Array<string> | undefined>();
  expect(options.paths).type.toBe<Array<string> | undefined>();
  expect(options.rootDir).type.toBe<string | undefined>();

  return path;
};

const notReturningAsyncResolver = async () => {};
expect<AsyncResolver>().type.not.toBeAssignableWith(
  notReturningAsyncResolver(),
);

// SyncResolver

const syncResolver: SyncResolver = (path, options) => {
  expect(path).type.toBe<string>();

  expect(options.basedir).type.toBe<string>();
  expect(options.conditions).type.toBe<Array<string> | undefined>();
  expect(options.defaultResolver).type.toBe<SyncResolver>();
  expect(options.extensions).type.toBe<Array<string> | undefined>();
  expect(options.moduleDirectory).type.toBe<Array<string> | undefined>();
  expect(options.paths).type.toBe<Array<string> | undefined>();
  expect(options.rootDir).type.toBe<string | undefined>();

  return path;
};

const notReturningSyncResolver = () => {};
expect<SyncResolver>().type.not.toBeAssignableWith(notReturningSyncResolver());

// JestResolver

expect<JestResolver>().type.toBeAssignableWith({async: asyncResolver});
expect<JestResolver>().type.toBeAssignableWith({sync: syncResolver});
expect<JestResolver>().type.toBeAssignableWith({
  async: asyncResolver,
  sync: syncResolver,
});
expect<JestResolver>().type.not.toBeAssignableWith({});
