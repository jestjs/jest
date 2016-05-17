/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const JasmineFormatter = require('jest-util').JasmineFormatter;

const paths = Object.create(null);
let lastJasmine;

const setLastTest = (description, filePath) => {
  paths[filePath] = paths[filePath] || {};
  paths[filePath].lastTest = description;
};

const getLastTest = filePath => paths[filePath].lastTest;

const setJasmine = jasmineInstance => {
  // doesn't matter which jasmine we are using as it's only needed by formatter
  lastJasmine = jasmineInstance;
};

const getFormatter = () => new JasmineFormatter(lastJasmine, {});

module.exports = {
  setLastTest,
  getLastTest,
  setJasmine,
  getFormatter,
};
