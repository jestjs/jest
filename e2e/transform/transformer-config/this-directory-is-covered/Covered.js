/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const thisFunctionIsCovered = (): null => null;

thisFunctionIsCovered();

const thisFunctionIsNotCovered = (): void => {
  throw new Error('Never Called');
};

module.exports = {
  thisFunctionIsCovered,
  thisFunctionIsNotCovered,
};
