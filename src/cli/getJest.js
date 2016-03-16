/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = require('graceful-fs');
const path = require('path');

function getJest(cwdPackageRoot) {
  // Get a jest instance
  let jest;

  // Is there a package.json at our cwdPackageRoot that indicates that there
  // should be a version of Jest installed?
  const cwdPkgJsonPath = path.join(cwdPackageRoot, 'package.json');

  // Is there a version of Jest installed at our cwdPackageRoot?
  const cwdJestBinPath = path.join(cwdPackageRoot, 'node_modules/jest-cli');

  if (fs.existsSync(cwdJestBinPath)) {
    // If a version of Jest was found installed in the CWD package, use that.
    jest = require(cwdJestBinPath);

    if (!jest.runCLI) {
      console.error(
        'This project requires an older version of Jest than what you have ' +
        'installed globally.\n' +
        'Please upgrade this project past Jest version 0.1.5'
      );

      process.on('exit', () => process.exit(1));
    }
  } else {
    // Otherwise, load this version of Jest.
    jest = require('./../../');

    // If a package.json was found in the CWD package indicating a specific
    // version of Jest to be used, bail out and ask the user to `npm install`
    // first
    if (fs.existsSync(cwdPkgJsonPath)) {
      const cwdPkgJson = require(cwdPkgJsonPath);
      const cwdPkgDeps = cwdPkgJson.dependencies;
      const cwdPkgDevDeps = cwdPkgJson.devDependencies;

      if (cwdPkgDeps && cwdPkgDeps['jest-cli']
        || cwdPkgDevDeps && cwdPkgDevDeps['jest-cli']) {
        console.error(
          'Please run `npm install` to use the version of Jest intended for ' +
          'this project.'
        );

        process.on('exit', () => process.exit(1));
      }
    }
  }

  return jest;
}

module.exports = getJest;
