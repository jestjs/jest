/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {WatchPlugin} from '../types';

const PLUGIN_NAME = 'test-path-pattern';
export default {
  apply: () => {},
  key: 'x'.codePointAt(0),
  name: PLUGIN_NAME,
  prompt: 'adsad',
};
