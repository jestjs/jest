/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import JSDOM from 'jsdom';
import BaseEnv from '@jest/environment-jsdom-abstract';

export default class JestJSDOMEnvironment extends BaseEnv {
  constructor(config, context) {
    super(config, context, JSDOM);
  }
}
