/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import module = require('module');

// "private" api
declare const process: NodeJS.Process & {
  binding(type: string): Record<string, unknown>;
};

const EXPERIMENTAL_MODULES = ['worker_threads'];

const BUILTIN_MODULES = new Set(
  module.builtinModules
    ? module.builtinModules.concat(EXPERIMENTAL_MODULES)
    : Object.keys(process.binding('natives'))
        .filter((module: string) => !/^internal\//.test(module))
        .concat(EXPERIMENTAL_MODULES),
);

export default function isBuiltinModule(module: string): boolean {
  // https://nodejs.org/api/modules.html#modules_core_modules
  // Core modules can also be identified using the node: prefix, for instance, require('node:http')

  return BUILTIN_MODULES.has(
    module.startsWith('node:') ? module.slice(5) : module,
  );
}
