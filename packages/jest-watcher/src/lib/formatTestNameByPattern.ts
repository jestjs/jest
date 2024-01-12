/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import colorize from './colorize';

const DOTS = '...';
const ENTER = '⏎';

export default function formatTestNameByPattern(
  testName: string,
  pattern: string,
  width: number,
): string {
  const inlineTestName = testName.replaceAll(/(\r\n|\n|\r)/gm, ENTER);

  let regexp;

  try {
    regexp = new RegExp(pattern, 'i');
  } catch {
    return chalk.dim(inlineTestName);
  }

  const match = inlineTestName.match(regexp);

  if (!match) {
    return chalk.dim(inlineTestName);
  }

  const startPatternIndex = Math.max(match.index ?? 0, 0);
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
}
