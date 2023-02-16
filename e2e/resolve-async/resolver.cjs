/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {promisify} = require('util');

const wait = promisify(setTimeout);

module.exports = {
  async: async (request, opts) => {
    await wait(500);

    if (request === '../some-file') {
      request = '../some-other-file';
    }

    return opts.defaultResolver(request, opts);
  },
};
