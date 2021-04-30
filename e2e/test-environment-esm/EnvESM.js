/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import NodeEnvironment from 'jest-environment-node';

export default class Env extends NodeEnvironment {
  constructor(...args) {
    super(...args);
    this.global.someVar = 42;
  }
}
