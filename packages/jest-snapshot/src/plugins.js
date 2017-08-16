/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Plugin} from 'types/PrettyFormat';

import prettyFormat from 'pretty-format';

const {
  HTMLElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormat.plugins;

let PLUGINS = [ReactTestComponent, ReactElement, HTMLElement, Immutable];

// Prepend to list so the last added is the first tested.
exports.addSerializer = (plugin: Plugin) => {
  PLUGINS = [plugin].concat(PLUGINS);
};

exports.getSerializers = () => PLUGINS;
