/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {transform: babelTransform} = require('babel-core');
const {default: babelIstanbulPlugin} = require('babel-plugin-istanbul');
const jestPreset = require.resolve('babel-preset-jest');

const options = {
  presets: ['env', jestPreset],
  retainLines: true,
  sourceMaps: 'inline',
};

module.exports = {
  canInstrument: true,
  process(src, filename, config, transformOptions) {
    options.filename = filename;
    if (transformOptions && transformOptions.instrument) {
      options.auxiliaryCommentBefore = ' istanbul ignore next ';
      options.plugins = [
        [
          babelIstanbulPlugin,
          {
            cwd: config.rootDir,
            exclude: [],
          },
        ],
      ];
    }

    const transformResult = babelTransform(src, options);

    if (!transformResult) {
      return src;
    }

    return transformResult.code;
  },
};
