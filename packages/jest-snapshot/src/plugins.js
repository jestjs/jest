/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Plugin} from 'types/PrettyFormat';

import prettyFormat from 'pretty-format';
import jestMockSerializer from './mock_serializer';

const {
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormat.plugins;

let PLUGINS = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  Immutable,
  jestMockSerializer,
];

// Prepend to list so the last added is the first tested.
export const addSerializer = (plugin: Plugin) => {
  PLUGINS = [plugin].concat(PLUGINS);
};

export const getSerializers = () => PLUGINS;
