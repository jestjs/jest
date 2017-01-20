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

const readConfig = (argv: Object, packageRoot: string) =>
  readRawConfig(argv, packageRoot)
    .then(config => Object.freeze(setFromArgv(config, argv)));

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
    return loadFromFile(path.resolve(process.cwd(), rawConfig), argv);
  }

  if (typeof rawConfig === 'object') {
    const config = Object.assign({}, rawConfig);
    config.rootDir = config.rootDir || root;
    return Promise.resolve(normalize(config, argv));
  }

  return loadFromPackage(path.join(root, 'package.json'), argv)
    .then(config => config || normalize({rootDir: root}, argv));
};

module.exports = {
  normalize,
  readConfig,
};
