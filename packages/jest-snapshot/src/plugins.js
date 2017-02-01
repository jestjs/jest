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

const ReactElementPlugin = require('pretty-format/build/plugins/ReactElement');
const ReactTestComponentPlugin = require('pretty-format/build/plugins/ReactTestComponent');

let PLUGINS = [ReactElementPlugin, ReactTestComponentPlugin];

// Prepend to list so the last added is the first tested.
exports.addSerializer = (plugin: any) => {
  PLUGINS = [plugin].concat(PLUGINS);
};

exports.getSerializers = () => PLUGINS;
