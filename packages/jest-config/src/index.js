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

const path = require('path');
const loadFromFile = require('./loadFromFile');
const loadFromPackage = require('./loadFromPackage');
const normalize = require('./normalize');
const setFromArgv = require('./setFromArgv');
const {getTestEnvironment} = require('./utils');

async function readConfig(argv: Object, packageRoot: string) {
  const rawConfig = await readRawConfig(argv, packageRoot);
  const {config, hasDeprecationWarnings} = normalize(rawConfig);
  return {
    config: Object.freeze(setFromArgv(config, argv)),
    hasDeprecationWarnings,
  };
}

const parseConfig = argv => {
  if (argv.config && typeof argv.config === 'string') {
    // If the passed in value looks like JSON, treat it as an object.
    if (argv.config[0] === '{' && argv.config[argv.config.length - 1] === '}') {
      return JSON.parse(argv.config);
    }
  }
  return argv.config;
};

const readRawConfig = (argv, root) => {
  const rawConfig = parseConfig(argv);

  if (typeof rawConfig === 'string') {
    return loadFromFile(path.resolve(process.cwd(), rawConfig));
  }

  if (typeof rawConfig === 'object') {
    const config = Object.assign({}, rawConfig);
    config.rootDir = config.rootDir || root;
    return Promise.resolve(config);
  }

  return loadFromPackage(root)
    .then(config => {
      if (config) {
        return config;
      }
      return {rootDir: root};
    });
};

module.exports = {
  getTestEnvironment,
  normalize,
  readConfig,
};
