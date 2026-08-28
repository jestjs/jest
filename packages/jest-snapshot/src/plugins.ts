/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createTranspilingRequire} from '@jest/transform';
import type {Config} from '@jest/types';
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

/** Loads configured serializers in the order expected by addSerializer. */
export const loadSerializersFromConfig = async (
  config: Config.ProjectConfig,
): Promise<PrettyFormatPlugins> => {
  if (config.snapshotSerializers.length === 0) {
    return [];
  }

  const localRequire = await createTranspilingRequire(config);
  const serializers: Array<PrettyFormatPlugin> = [];

  // Configured serializers run before built-ins and keep their configured order.
  // addSerializer prepends, so load them in reverse.
  for (const serializerPath of [...config.snapshotSerializers].reverse()) {
    serializers.push(
      await localRequire<PrettyFormatPlugin>(serializerPath, true),
    );
  }

  return serializers;
};
