/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {fc} from '@fast-check/jest';

// settings for anything arbitrary
export const anythingSettings = {
  key: fc.oneof(fc.string(), fc.constantFrom('k1', 'k2', 'k3')),
  maxDepth: 2, // Limit object depth (default: 2)
  maxKeys: 5, // Limit number of keys per object (default: 5)
  withBoxedValues: true,
  // Issue #7975 have to be fixed before enabling the generation of Map
  withMap: false,
  // Issue #7975 have to be fixed before enabling the generation of Set
  withSet: false,
};

// assertion settings
export const assertSettings = {}; // eg.: {numRuns: 10000}
