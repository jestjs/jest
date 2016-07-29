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

import type {Config, Path} from 'types/Config';

const babel = require('babel-core');
const jestPreset = require('babel-preset-jest');
const {shouldBeCovered} = require('jest-config');

const createTransformer = (options: any) => {
  options = Object.assign({}, options, {
    auxiliaryCommentBefore: ' istanbul ignore next ',
    presets: ((options && options.presets) || []).concat([jestPreset]),
    retainLines: true,
  });
  delete options.cacheDirectory;

  return {
    INSTRUMENTS: true,
    process(src: string, filename: Path, config: Config) {
      let plugins = options.plugins || [];

      if (shouldBeCovered(filename, config)) {
        plugins = plugins.concat(require('babel-plugin-istanbul').default);
      }

      if (babel.util.canCompile(filename)) {
        return babel.transform(
          src,
          Object.assign({}, options, {filename, plugins}),
        ).code;
      }
      return src;
    },
  };
};

module.exports = createTransformer();
(module.exports: any).createTransformer = createTransformer;
