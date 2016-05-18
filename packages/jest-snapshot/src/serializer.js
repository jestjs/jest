/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const common = require('./common');
const server = require('react-dom/server');

module.exports = {
  serialize(object) {
    if (object && object.$$typeof === Symbol.for('react.element')) {
      return server.renderToString(object);
    }
    return '' + object;
  },
};
