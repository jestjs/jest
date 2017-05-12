/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

declare module "resolve" {
  declare function isCore(moduleName: string): boolean;
  declare function sync(path: string): string;
}

declare module "resolve/lib/node-modules-paths" {
  declare type NodeModulesPathsOptions = {
    moduleDirectory: Array<string>,
  };

  declare function exports(
    path: string,
    options: NodeModulesPathsOptions,
  ): Array<string>;
}
