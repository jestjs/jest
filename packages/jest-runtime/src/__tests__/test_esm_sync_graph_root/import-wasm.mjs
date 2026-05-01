/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Minimal wasm module: just the magic bytes + version, no exports.
// Exercises the `application/wasm` data: URI branch and the wasm sync
// constructor in the v24.9+ sync core.
import * as wasmMod from 'data:application/wasm;base64,AGFzbQEAAAA=';

export {wasmMod};
