/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const exportedModules = new Map([
  ['foo', 'foo'],
  ['bar', 'bar'],
]);

module.exports = (name, options) => {
  const resolution = exportedModules.get(name);

  if (resolution) {
    return `${__dirname}/${resolution}.js`;
  } else {
    return options.defaultResolver(name, options);
  }
};
