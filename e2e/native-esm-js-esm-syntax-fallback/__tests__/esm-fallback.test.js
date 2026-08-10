/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// esm-no-marker has ESM syntax (export) but no "type":"module" and a .js
// extension, so Jest cannot pre-classify it as ESM. The runtime must fall back
// to native ESM loading after the CJS parse fails.
import {esmNoMarkerValue} from 'esm-no-marker';

test('falls back to native ESM for a .js file with ESM syntax and no type:module marker', () => {
  expect(esmNoMarkerValue).toBe(456);
});
