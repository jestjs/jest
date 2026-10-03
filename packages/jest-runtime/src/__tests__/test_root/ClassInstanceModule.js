/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

class ClassInstance {
  constructor() {
    this.array = [1, 2, 3];
    this.lang = 'JS';
  }

  foo() {}
}

module.exports = new ClassInstance();
