/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import supportsColor = require('supports-color');
delete require.cache[require.resolve('supports-color')];

type SupportsColor = supportsColor.supportsColor.SupportsColor;

const extractColorLevel = (info: SupportsColor) => {
  return info ? info.level : 0;
};

type ColorLevel = ReturnType<typeof extractColorLevel>;
export interface ColorLevels {
  stderr: ColorLevel;
  stdout: ColorLevel;
}

const {stderr, stdout} = supportsColor;
const colorLevel: ColorLevels = {
  stderr: extractColorLevel(stderr),
  stdout: extractColorLevel(stdout),
};

export default colorLevel;
