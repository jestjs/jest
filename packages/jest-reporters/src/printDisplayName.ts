/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {Config} from '@jest/types';

export default function printDisplayName(config: Config.ProjectConfig): string {
  const {displayName} = config;
  const white = (str: string) => pc.reset(pc.inverse(pc.white(str)));
  if (!displayName) {
    return '';
  }

  const {name, color} = displayName;
  const chosenColor = (str: string) =>
    color ? pc.reset(pc.inverse(pc.createColors()[color](str))) : white(str);
  return pc.isColorSupported ? chosenColor(` ${name} `) : name;
}
