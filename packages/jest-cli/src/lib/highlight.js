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
const path = require('path');

const hit = chalk.reset;
const miss = chalk.dim;

const trim = '...';
const relativePathHead = './';

const colorize = (str: string, start: number, end: number) => (
  miss(str.slice(0, start)) +
  hit(str.slice(start, end)) +
  miss(str.slice(end))
);

const highlight = (
  rawPath: string,
  filePath: string,
  pattern: string,
  rootDir: string,
) => {

  let regexp;

  try {
    regexp = new RegExp(pattern, 'i');
  } catch (e) {
    return miss(filePath);
  }

  rawPath = chalk.stripColor(rawPath);
  filePath = chalk.stripColor(filePath);
  const match = rawPath.match(regexp);

  if (!match) {
    return miss(filePath);
  }

  let offset;
  let trimLength;

  if (filePath.startsWith(trim)) {
    offset = rawPath.length - filePath.length;
    trimLength = trim.length;
  } else if (filePath.startsWith(relativePathHead)) {
    offset = rawPath.length - filePath.length;
    trimLength = relativePathHead.length;
  } else {
    offset = rootDir.length + path.sep.length;
    trimLength = 0;
  }

  const start = match.index - offset;
  const end = start + match[0].length;
  return colorize(filePath, Math.max(start, 0), Math.max(end, trimLength));
};

module.exports = highlight;
