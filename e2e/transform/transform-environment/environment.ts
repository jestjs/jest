/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';
import NodeEnvironment from 'jest-environment-node';

export default class CustomEnvironment extends NodeEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    this.global.one = 1;
  }
}
