/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const parser = require('jsonlint').parser;

function parseFileContents(filePath, jsonBuffer) {
  const jsonData = String(jsonBuffer);
  try {
    return parser.parse(jsonData);
  } catch (e) {
    const errorMsg = e.toString();
    throw new Error(`Jest: Failed to parse config file ${ filePath }.`
        + `\n${ errorMsg }`);
  }
}

module.exports = parseFileContents;
