/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import module = require('module');

const BUILTIN_MODULES = new Set(module.builtinModules);

export default function isBuiltinModule(module: string): boolean {
  return BUILTIN_MODULES.has(module);
}
