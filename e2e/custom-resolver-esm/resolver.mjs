/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fileURLToPath} from 'node:url';

// A top-level await, so this module can never be loaded by `require` - not on
// any version of Node. It has to go through `import()`.
const exportedModules = await Promise.resolve(
  new Map([
    ['foo', 'foo'],
    ['bar', 'bar'],
  ]),
);

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default (name, options) => {
  const resolution = exportedModules.get(name);

  if (resolution) {
    return `${dirname}${resolution}.js`;
  }

  return options.defaultResolver(name, options);
};
