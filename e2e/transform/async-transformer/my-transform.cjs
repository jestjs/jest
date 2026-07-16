/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {promisify} = require('util');

const wait = promisify(setTimeout);

const fileToTransform = require.resolve('./module-under-test');
const fileToTransform2 = require.resolve('./some-symbol');

module.exports = {
  async processAsync(src, filepath) {
    if (filepath !== fileToTransform && filepath !== fileToTransform2) {
      throw new Error(`Unsupported filepath ${filepath}`);
    }

    if (filepath === fileToTransform2) {
      // we want to wait to ensure the module cache is populated with the correct module
      await wait(100);

      return {code: src};
    }

    return {
      code: src.replace(
        "export default 'It was not transformed!!'",
        'export default 42',
      ),
    };
  },
};
