/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
  default: defaultResolver,
} = require('jest-resolve/build/defaultResolver');

const exportedModules = new Map([
  ['foo', 'foo'],
  ['bar', 'bar'],
]);

module.exports = (name, options) => {
  const resolution = exportedModules.get(name);

  if (resolution) {
    return `${__dirname}/${resolution}.js`;
  } else {
    return defaultResolver(name, options);
  }
};
