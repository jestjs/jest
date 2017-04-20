/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {ProjectConfig} from './Config';
import type {HasteFS, ModuleMap} from './HasteMap';
import type HasteResolver from 'jest-resolve';

export type Context = {|
  config: ProjectConfig,
  hasteFS: HasteFS,
  moduleMap: ModuleMap,
  resolver: HasteResolver,
|};
