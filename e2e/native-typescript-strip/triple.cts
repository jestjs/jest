/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type Multiplier = (value: number) => number;

const triple: Multiplier = value => value * 3;

module.exports = {triple};
