/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import path from 'path';

module.exports = function createRuntime(filename, config) {
  const NodeEnvironment = require('jest-environment-node');
  const Runtime = require('../');

  const {normalize} = require('jest-config');

  config = normalize(
    Object.assign(
      {
        name: 'Runtime-' + filename.replace(/\W/, '-') + '.tests',
        rootDir: path.resolve(path.dirname(filename), 'test_root'),
      },
      config,
    ),
    {},
  ).options;

  const environment = new NodeEnvironment(config);
  environment.global.console = console;
  return Runtime.createHasteMap(config, {maxWorkers: 1, resetCache: false})
    .build()
    .then(hasteMap => {
      const runtime = new Runtime(
        config,
        environment,
        Runtime.createResolver(config, hasteMap.moduleMap),
      );

      runtime.__mockRootPath = path.join(config.rootDir, 'root.js');
      runtime.__mockSubdirPath = path.join(
        config.rootDir,
        'subdir2',
        'module_dir',
        'moduleDirModule.js',
      );
      return runtime;
    });
};
