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

const fs = require('fs');
const path = require('path');
const opn = require('opn');
const chalk = require('chalk');
const {clearLine} = require('jest-util');

const openFileInBrowser = async (url: string) => {
  try {
    await opn(url); // Prevent `unhandledRejection` error.
  } catch (err) {
    clearLine(process.stderr);
    clearLine(process.stdout);
    console.error(chalk.red(err.stack));
  }
};

const getCoverageDirectory = (coverageDirectory: string) => {
  return coverageDirectory || 'coverage';
};

const openReportInBrowser = (coverageDirectory: string) => {
  const coverageDirectoryPath = path.join(
    getCoverageDirectory(coverageDirectory),
    'lcov-report',
    'index.html',
  );
  if (fs.existsSync(coverageDirectoryPath)) {
    openFileInBrowser(coverageDirectoryPath);
  }
};

module.exports = openReportInBrowser;
