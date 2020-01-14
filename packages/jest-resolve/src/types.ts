/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Path} from '@jest/config-utils';

export type ResolverConfig = {
  browser?: boolean;
  defaultPlatform?: string | null;
  extensions: Array<string>;
  hasCoreModules: boolean;
  moduleDirectories: Array<string>;
  moduleNameMapper?: Array<ModuleNameMapperConfig> | null;
  modulePaths?: Array<Path>;
  platforms?: Array<string>;
  resolver?: Path | null;
  rootDir: Path;
};

type ModuleNameMapperConfig = {
  regex: RegExp;
  moduleName: string;
};
