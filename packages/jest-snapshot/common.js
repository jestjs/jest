/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const common = Object.create(null);
const JasmineFormatter = require('jest-util/lib/JasmineFormatter');

const paths = Object.create(null);
let lastJasmine;

common.setLastTest = (description, filePath) => {
  paths[filePath] = paths[filePath] || {};
  paths[filePath].lastTest = description;
};

common.getLastTest = filePath => paths[filePath].lastTest;

common.setJasmine = jasmineInstance => {
  // doesn't matter which jasmine we are using as it's only needed by formatter
  lastJasmine = jasmineInstance;
};

common.getFormatter = () => new JasmineFormatter(lastJasmine, {});

module.exports = common;
