/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import chalk from 'chalk';

export default (str: string, start: number, end: number) =>
  chalk.dim(str.slice(0, start)) +
  chalk.reset(str.slice(start, end)) +
  chalk.dim(str.slice(end));
