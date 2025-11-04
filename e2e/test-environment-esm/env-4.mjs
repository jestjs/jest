/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TestEnvironment} from 'jest-environment-node';

export default class Env extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    import.meta.someVar = 42;
    this.global.someVar = import.meta.someVar;
  }
}
