/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {WatchPlugin} from '../types';
import getType from 'jest-get-type';
import defaultResolver from '../../../jest-resolve/src/default_resolver';

const RESERVED_KEYS = [
  0x03, // Jest should handle ctrl-c interrupt
  'q'.codePointAt(0), // 'q' is reserved for quit
];

export default class WatchPluginRegistry {
  _rootDir: string;
  _watchPluginsByKey: Map<number, WatchPlugin>;

  constructor(rootDir: string) {
    this._rootDir = rootDir;
    this._watchPluginsByKey = new Map();
  }

  loadPluginPath(pluginModulePath: string) {
    // $FlowFixMe dynamic require
    const maybePlugin = require(defaultResolver(pluginModulePath, {
      basedir: this._rootDir,
    }));

    // Since we're loading the module from a dynamic path, assert its shape
    // before assuming it's a valid watch plugin.
    if (getType(maybePlugin) !== 'object') {
      throw new Error(
        `Jest watch plugin ${
          pluginModulePath
        } must be an ES Module or export an object`,
      );
    }
    if (getType(maybePlugin.key) !== 'number') {
      throw new Error(
        `Jest watch plugin ${pluginModulePath} must export 'key' as a number`,
      );
    }
    if (getType(maybePlugin.prompt) !== 'string') {
      throw new Error(
        `Jest watch plugin ${
          pluginModulePath
        } must export 'prompt' as a string`,
      );
    }
    if (getType(maybePlugin.enter) !== 'function') {
      throw new Error(
        `Jest watch plugin ${
          pluginModulePath
        } must export 'enter' as a function`,
      );
    }

    const plugin: WatchPlugin = ((maybePlugin: any): WatchPlugin);

    if (RESERVED_KEYS.includes(maybePlugin.key)) {
      throw new Error(
        `Jest watch plugin ${
          pluginModulePath
        } tried to register reserved key ${String.fromCodePoint(
          maybePlugin.key,
        )}`,
      );
    }
    // TODO: Reject registering when another plugin has claimed the key?
    this._watchPluginsByKey.set(plugin.key, plugin);
  }

  getPluginByPressedKey(pressedKey: number): ?WatchPlugin {
    return this._watchPluginsByKey.get(pressedKey);
  }

  getPluginsOrderedByKey(): Array<WatchPlugin> {
    return Array.from(this._watchPluginsByKey.values()).sort(
      (a, b) => a.key - b.key,
    );
  }
}
