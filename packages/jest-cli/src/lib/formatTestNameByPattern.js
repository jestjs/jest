/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

const chalk = require('chalk');
const colorize = require('./colorize');

const DOTS = '...';
const ENTER = '⏎';

module.exports = (testName: string, pattern: string, width: number) => {
  const inlineTestName = testName.replace(/(\r\n|\n|\r)/gm, ENTER);

  let regexp;

  try {
    regexp = new RegExp(pattern, 'i');
  } catch (e) {
    return chalk.dim(inlineTestName);
  }

  const match = inlineTestName.match(regexp);

  if (!match) {
    return chalk.dim(inlineTestName);
  }

  // $FlowFixMe
  const startPatternIndex = Math.max(match.index, 0);
  const endPatternIndex = startPatternIndex + match[0].length;

  if (inlineTestName.length <= width) {
    return colorize(inlineTestName, startPatternIndex, endPatternIndex);
  }

  const slicedTestName = inlineTestName.slice(0, width - DOTS.length);

  if (startPatternIndex < slicedTestName.length) {
    if (endPatternIndex > slicedTestName.length) {
      return colorize(
        slicedTestName + DOTS,
        startPatternIndex,
        slicedTestName.length + DOTS.length,
      );
    } else {
      return colorize(
        slicedTestName + DOTS,
        Math.min(startPatternIndex, slicedTestName.length),
        endPatternIndex,
      );
    }
  }

  return `${chalk.dim(slicedTestName)}${chalk.reset(DOTS)}`;
};
