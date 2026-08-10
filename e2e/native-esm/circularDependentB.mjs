/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import circularDependentA from './circularDependentA.mjs';

export default {
  id: 'circularDependentB',
  get moduleA() {
    return circularDependentA;
  },
};
