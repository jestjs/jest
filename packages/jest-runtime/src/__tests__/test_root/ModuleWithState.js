/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

let state = 1;

export const set = i => {
  state = i;
};

export const increment = () => {
  state += 1;
};

export const getState = () => state;
