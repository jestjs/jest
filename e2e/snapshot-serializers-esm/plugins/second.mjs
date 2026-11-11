/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default {
  serialize: value => `second: ${value.value}`,
  test: value => value?.kind === 'both' || value?.kind === 'second',
};
