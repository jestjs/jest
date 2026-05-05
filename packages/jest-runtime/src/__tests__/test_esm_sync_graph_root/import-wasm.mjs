/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Minimal wasm module: magic bytes + version, no exports.
import * as wasmMod from 'data:application/wasm;base64,AGFzbQEAAAA=';

export {wasmMod};
