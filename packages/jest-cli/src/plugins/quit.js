/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {WatchPlugin} from '../types';

const PLUGIN_NAME = 'quit';
const quitPlugin: WatchPlugin = {
  apply: (jestHooks, {stdin, stdout}) => {
    jestHooks.showPrompt.tapPromise(PLUGIN_NAME, () => {
      stdout.write('\n');
      process.exit(0);
    });
  },
  key: 'q'.codePointAt(0),
  name: PLUGIN_NAME,
  prompt: 'quit watch mode',
};

export default quitPlugin;
