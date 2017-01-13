/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const chalk = require('chalk');

const hit = chalk.reset;
const miss = chalk.dim;

const highlight = (str: string, pattern: string) => {
  let regexp;

  try {
    regexp = new RegExp(pattern, 'i');
  } catch (e) {
    return miss(str);
  }

  const match = regexp.exec(str);
  if (!match) {
    return miss(str);
  }

  const {index} = match;
  const startMatch = match.index;
  const endMatch = startMatch + match[0].length;

  return (
    miss(str.slice(0, index)) +
    hit(str.slice(startMatch, endMatch)) +
    miss(str.slice(endMatch))
  );
};

module.exports = highlight;
