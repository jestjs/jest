/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type _Resolver from 'jest-resolve';

import type {Path} from './Config';

export type ResolveModuleConfig = {|
  skipNodeResolution?: boolean,
  paths?: Path[],
|};

export type Resolver = _Resolver;
