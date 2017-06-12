/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* $FlowFixMe */
const getTerminalWidth = (): number => process.stdout.columns;

const rightPad = (input: string): string => {
  const termWidth = getTerminalWidth();
  input += Array(termWidth - input.length + 1).join(' ');
  return input;
};

module.exports = {
  getTerminalWidth,
  rightPad,
};
