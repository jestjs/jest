/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectError, expectType} from 'tsd-lite';
import type {AsyncResolver, JestResolver, SyncResolver} from 'jest-resolve';

type PackageJson = Record<string, unknown>;
type PackageFilter = (
  pkg: PackageJson,
  file: string,
  dir: string,
) => PackageJson;
type PathFilter = (
  pkg: PackageJson,
  path: string,
  relativePath: string,
) => string;

// AsyncResolver

const asyncResolver: AsyncResolver = async (path, options) => {
  expectType<string>(path);

  expectType<string>(options.basedir);
  expectType<Array<string> | undefined>(options.conditions);
  expectType<SyncResolver>(options.defaultResolver);
  expectType<Array<string> | undefined>(options.extensions);
  expectType<Array<string> | undefined>(options.moduleDirectory);
  expectType<PackageFilter | undefined>(options.packageFilter);
  expectType<PathFilter | undefined>(options.pathFilter);
  expectType<Array<string> | undefined>(options.paths);
  expectType<string | undefined>(options.rootDir);

  return path;
};

const notReturningAsyncResolver = async () => {};
expectError<AsyncResolver>(notReturningAsyncResolver());

// SyncResolver

const syncResolver: SyncResolver = (path, options) => {
  expectType<string>(path);

  expectType<string>(options.basedir);
  expectType<Array<string> | undefined>(options.conditions);
  expectType<SyncResolver>(options.defaultResolver);
  expectType<Array<string> | undefined>(options.extensions);
  expectType<Array<string> | undefined>(options.moduleDirectory);
  expectType<PackageFilter | undefined>(options.packageFilter);
  expectType<PathFilter | undefined>(options.pathFilter);
  expectType<Array<string> | undefined>(options.paths);
  expectType<string | undefined>(options.rootDir);

  return path;
};

const notReturningSyncResolver = () => {};
expectError<SyncResolver>(notReturningSyncResolver());

// JestResolver

expectAssignable<JestResolver>({async: asyncResolver});
expectAssignable<JestResolver>({sync: syncResolver});
expectAssignable<JestResolver>({async: asyncResolver, sync: syncResolver});
expectError<JestResolver>({});
