/* eslint-disable no-unused-vars */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = function doES6Stuff(testObj, multiplier) {
  const {someNumber, ...others} = testObj;
  return someNumber * multiplier;
};
