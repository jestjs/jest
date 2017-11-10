/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const v8 = require('v8');
const vm = require('vm');
const weak = require('weak');

// Setting the flag has no effect on the main context, but will allow new
// contexts to access the garbage collector.
v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc');

const PRIMITIVE_TYPES = new Set([
  'undefined',
  'boolean',
  'number',
  'string',
  'symbol',
]);

export default class {
  _held: boolean;

  constructor(value: ?Object) {
    if (this._isPrimitive(value)) {
      throw new TypeError('Primitives cannot leak memory');
    }

    weak(value, () => (this._held = false));
    this._held = true;

    // Ensure value is not leaked by the closure created by the "weak" callback.
    value = null;
  }

  isLeaked(): boolean {
    gc();

    return this._held;
  }

  _isPrimitive(value: any): boolean {
    return value === null || PRIMITIVE_TYPES.has(typeof value);
  }
}
