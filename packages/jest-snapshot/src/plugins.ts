/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  type Plugin as PrettyFormatPlugin,
  type Plugins as PrettyFormatPlugins,
  plugins as prettyFormatPlugins,
} from 'pretty-format';
import jestMockSerializer from './mockSerializer';

const {
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
  AsymmetricMatcher,
} = prettyFormatPlugins;

let PLUGINS: PrettyFormatPlugins = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  jestMockSerializer,
  AsymmetricMatcher,
];

// Prepend to list so the last added is the first tested.
export const addSerializer = (plugin: PrettyFormatPlugin): void => {
  PLUGINS = [plugin, ...PLUGINS];
};

export const getSerializers = (): PrettyFormatPlugins => PLUGINS;
