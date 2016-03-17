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
  const packageJSONPath = path.join(cwdPackageRoot, 'package.json');
  const binPath = path.join(cwdPackageRoot, 'node_modules/jest-cli');
  if (fs.existsSync(binPath)) {
    return require(binPath);
  } else {
    const jest = require('../jest');
    // Check if Jest is specified in `package.json` but not installed.
    if (fs.existsSync(packageJSONPath)) {
      const packageJSON = require(packageJSONPath);
      const dependencies = packageJSON.dependencies;
      const devDependencies = packageJSON.devDependencies;
      if (
        (dependencies && dependencies['jest-cli']) ||
        (devDependencies && devDependencies['jest-cli'])
      ) {
        console.error(
          'Please run `npm install` to use the version of Jest intended for ' +
          'this project.'
        );
        process.on('exit', () => process.exit(1));
      }
    }
    return jest;
  }
}

module.exports = getJest;
