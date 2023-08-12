/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
let myState = 0;

export function incState() {
  myState += 1;
}

export function getState() {
  return myState;
}
