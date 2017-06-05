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

const cwd = process.cwd();
const replace = new RegExp(cwd, 'g');

module.exports = {
  print(val: string, serialize: mixed => string) {
    return serialize(val.replace(replace, '/..'));
  },
  test(val: mixed) {
    return typeof val === 'string' && val.indexOf(cwd) > -1;
  },
};
