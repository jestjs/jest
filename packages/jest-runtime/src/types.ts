/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ProjectConfig} from '@jest/config-utils';
import HasteResolver = require('jest-resolve');
import {FS as HasteFS, ModuleMap} from 'jest-haste-map';

export type Context = {
  config: ProjectConfig;
  hasteFS: HasteFS;
  moduleMap: ModuleMap;
  resolver: HasteResolver;
};
