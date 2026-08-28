/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = function loadDataUri() {
  return import('data:text/javascript,export function mocked() { return "real"; } export const value = 7;');
};
