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
const path = require('path');
const promisify = require('./lib/promisify');

function requireConfigFile(filePath: Path) {
  return promisify(fs.access)(filePath, fs.R_OK).then(
    () => {
      // $FlowFixMe
      const packageData = require(filePath);
      const config = packageData || {};

      return config;
    },
    () => null,
  );
}

function tryJestrc(loc: Path) {
  const jestrc = path.join(loc, '.jestrc');

  return requireConfigFile(jestrc)
    .then(config => {
      if (!config) {
        throw new Error();
      }

      return Object.assign({},
        config,
        {rootDir: config.rootDir ? path.resolve(loc, config.rootDir) : loc});
    });
}

function tryPackageJson(loc: Path) {
  const packageJson = path.join(loc, 'package.json');

  return requireConfigFile(packageJson)
    .then(config => {
      if (!config || !config.hasOwnProperty('jest')) {
        throw new Error();
      }

      return Object.assign({},
        config.jest,
        {
          rootDir: config.jest.rootDir ?
            path.resolve(loc, config.jest.rootDir) : loc,
        });
    });
}

function traverseUpTreeForConfig(loc: Path) {
  const configFetchMethods = [
    tryJestrc,
    tryPackageJson,
  ];

  const requireConfigAttempts = [];
  do {
    for (let i = 0; i < configFetchMethods.length; i++) {
      requireConfigAttempts.push(configFetchMethods[i].bind(null, loc));
    }
  } while (loc !== (loc = path.dirname(loc)));

  return new Promise((resolve, reject) => {
    let i = 0;
    const requireUntilSuccess = () => {
      const attempt = requireConfigAttempts[i++];
      if (attempt) {
        attempt().then(resolve).catch(requireUntilSuccess);
      } else {
        reject();
      }
    };

    requireUntilSuccess();
  });
}

module.exports = traverseUpTreeForConfig;
