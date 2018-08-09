/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

exports.createPlugin = prop => ({
  print: (val, serialize) => `${prop} - ${serialize(val[prop])}`,
  test: val => val && val.hasOwnProperty(prop),
});
