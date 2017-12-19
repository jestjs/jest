/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const thisFunctionIsCovered = () => {
  return null;
};

thisFunctionIsCovered();

const thisFunctionIsNotCovered = () => {
  throw new Error('Never Called');
};

module.exports = {
  thisFunctionIsCovered,
  thisFunctionIsNotCovered,
};
