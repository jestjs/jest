/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {SyntheticModule, Module as VMModule} from 'node:vm';
import type {Module} from '@jest/environment';

export type ImportAttributes = Record<string, string | undefined>;

export type ESModule = VMModule | SyntheticModule;
export type JestModule = ESModule | Promise<ESModule>;
export type InitialModule = Omit<Module, 'require' | 'parent' | 'paths'>;
export type ModuleRegistry = Map<string, InitialModule | Module | JestModule>;

// Registered before evaluation so a cycle reached mid-evaluation resolves to
// the same object.
export function createInitialModule(filename: string): InitialModule {
  return {
    children: [],
    exports: {},
    filename,
    id: filename,
    isPreloading: false,
    loaded: false,
    path: path.dirname(filename),
  };
}
