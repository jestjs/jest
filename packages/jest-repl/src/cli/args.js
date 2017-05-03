/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

const Runtime = require('jest-runtime');

const usage = 'Usage: $0 [--config=<pathToConfigFile>]';

const options = Object.assign({}, Runtime.getCLIOptions(), {
  replname: {
    alias: 'r',
    description: 'The "name" of the file given to transformers to be ' +
      'transformed. For example, "repl.ts" if using a Typescript transformer.',
    type: 'string',
  },
});

module.exports = {
  options,
  usage,
};
