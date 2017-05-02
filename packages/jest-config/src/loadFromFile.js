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

import type {Path} from 'types/Config';

const fs = require('fs');
const jsonlint = require('./vendor/jsonlint');
const path = require('path');

const parse = filePath => {
  if (filePath.endsWith('.js')) {
    // $FlowFixMe
    return require(filePath);
  }

  const data = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(data);
  } catch (e) {
    const error = jsonlint.errors(data);
    throw new Error(
      `Jest: Failed to parse config file ${filePath}\n  ${error}`,
    );
  }
};

const loadFromFile = (filePath: Path) => {
  const options = parse(filePath);
  options.rootDir = options.rootDir
    ? path.resolve(path.dirname(filePath), options.rootDir)
    : process.cwd();
  return options;
};

module.exports = loadFromFile;
