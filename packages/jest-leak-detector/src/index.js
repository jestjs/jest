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

// $FlowFixMe: native module.
const {size} = require('../build/Release/size');

const PRIMITIVE_TYPES = new Set([
  'undefined',
  'boolean',
  'number',
  'string',
  'symbol',
]);

export default class {
  _weakRef: WeakSet<Object>;

  _gc: () => {};

  constructor(value: Object) {
    if (this._isPrimitive(value)) {
      throw new TypeError('Primitives cannot leak memory');
    }

    this._weakRef = new WeakSet([value]);
    this._gc = this._getGarbageCollector();

    const result = size(this._weakRef);

    if (result !== 1) {
      throw new SyntaxError(
        'WeakSet should have exactly one element, got ' + result,
      );
    }
  }

  isLeaked(): boolean {
    this._gc();

    const result = size(this._weakRef);

    if (result !== 0 && result !== 1) {
      throw new SyntaxError(
        'WeakSet should have zero or one elements, got' + result,
      );
    }

    return result === 1;
  }

  _isPrimitive(value: any): boolean {
    return value === null || PRIMITIVE_TYPES.has(typeof value);
  }

  _getGarbageCollector(): () => {} {
    v8.setFlagsFromString('--expose-gc');

    return vm.runInNewContext('gc');
  }
}
