/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {initSync, parse} from 'es-module-lexer';

let initialized = false;

// Returns true when `source` contains ESM syntax (import/export declarations).
// Returns false if es-module-lexer itself throws (malformed/incomplete source).
// Lazily initialises the WASM backing on first call.
export function hasEsmSyntax(source: string): boolean {
  if (!initialized) {
    initSync();
    initialized = true;
  }
  try {
    return parse(source)[3];
  } catch {
    // parse() throws on syntax errors it cannot recover from. We cannot
    // determine whether the file is ESM — and native ESM would also fail —
    // so return false and let the original CJS error surface.
    return false;
  }
}
