/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Resolver from './resolver';

export type {
  AsyncResolver,
  SyncResolver,
  PackageFilter,
  PathFilter,
  ResolverOptions,
} from './defaultResolver';
export type {
  FindNodeModuleConfig,
  ResolveModuleConfig,
  ResolverObject as JestResolver,
} from './resolver';
export type {PackageJSON} from './types';
export * from './utils';

export default Resolver;
