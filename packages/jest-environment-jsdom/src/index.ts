/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as JSDOM from 'jsdom';
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';
import BaseEnv from '@jest/environment-jsdom-abstract';

export default class JSDOMEnvironment extends BaseEnv {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context, JSDOM);
  }
}

export const TestEnvironment = JSDOMEnvironment;
