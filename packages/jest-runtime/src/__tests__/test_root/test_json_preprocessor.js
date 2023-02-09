/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports.process = source => {
  const json = JSON.parse(source);
  Object.keys(json).forEach(k => (json[k] = k));
  return {code: JSON.stringify(json)};
};
