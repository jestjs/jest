/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {stderr, stdout, supportsColor} from 'supports-color';

const extractColorLevel = (info: supportsColor.SupportsColor) => {
  return info ? info.level : 0;
};

type ColorLevel = ReturnType<typeof extractColorLevel>;
export interface ColorLevels {
  stderr: ColorLevel;
  stdout: ColorLevel;
}

const colorLevel: ColorLevels = {
  stderr: extractColorLevel(stderr),
  stdout: extractColorLevel(stdout),
};

export default colorLevel;
