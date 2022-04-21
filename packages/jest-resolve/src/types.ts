/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type ResolverConfig = {
  defaultPlatform?: string | null;
  extensions: Array<string>;
  hasCoreModules: boolean;
  moduleDirectories: Array<string>;
  moduleNameMapper?: Array<ModuleNameMapperConfig> | null;
  modulePaths?: Array<string>;
  platforms?: Array<string>;
  resolver?: string | null;
  rootDir: string;
};

type ModuleNameMapperConfig = {
  regex: RegExp;
  moduleName: string | Array<string>;
};
