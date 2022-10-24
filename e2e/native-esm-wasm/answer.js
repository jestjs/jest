/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as wasm from './answer.wasm';

export function getAnswer() {
  const ret = wasm.getAnswer();
  return ret;
}
