/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {resolve: resolveExports} = require('resolve.exports');

module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    pathFilter: options.conditions
      ? createPathFilter(options.conditions)
      : undefined,
  });
};

function createPathFilter(conditions) {
  return function pathFilter(pkg, _path, relativePath) {
    // this `index` thing can backfire, but `resolve` adds it: https://github.com/browserify/resolve/blob/f1b51848ecb7f56f77bfb823511d032489a13eab/lib/sync.js#L192
    const path = relativePath === 'index' ? '.' : relativePath;

    return (
      resolveExports(pkg, path, {
        // `resolve.exports adds `node` unless `browser` is `false`, so let's add this ugly thing
        browser: conditions.includes('browser'),
        conditions,
        // `resolve.exports adds `import` unless `require` is `false`, so let's add this ugly thing
        require: conditions.includes('require'),
      }) || relativePath
    );
  };
}
