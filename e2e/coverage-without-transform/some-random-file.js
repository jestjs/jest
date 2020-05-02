/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = function doES6Stuff(testObj, multiplier) {
  // eslint-disable-next-line no-unused-vars
  const {someNumber, ...others} = testObj;
  return someNumber * multiplier;
};
