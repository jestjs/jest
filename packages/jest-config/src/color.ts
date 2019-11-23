/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createHash} from 'crypto';
import chalk = require('chalk');

const colors: Array<keyof typeof chalk> = [
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
];

export const getDisplayNameColor = (seed?: string) => {
  if (seed === undefined) {
    return 'white';
  }

  const hash = createHash('sha256');
  hash.update(seed);
  const num = hash.digest().readUInt32LE(0);
  return colors[num % colors.length];
};
