/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Both legs import the same ESM-fallback module (esm-no-marker). The sync
// linker must not call buildCjsAsEsmSyntheticModule twice for the same key.
export {esmNoMarkerValue as fromA} from './import-esm-no-marker.mjs';
export {esmNoMarkerValue as fromB} from './import-esm-no-marker-b.mjs';
