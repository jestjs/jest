/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const uri =
  'data:text/javascript,\texport function mocked() { return "real"; }';

module.exports = {
  load: () => import(uri),
  uri,
};
