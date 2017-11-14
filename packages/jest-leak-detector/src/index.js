/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import prettyFormat from 'pretty-format';
import v8 from 'v8';
import vm from 'vm';
import weak from 'weak';

const PRIMITIVE_TYPES = new Set([
  'undefined',
  'boolean',
  'number',
  'string',
  'symbol',
]);

export default class {
  _isReferenceBeingHeld: boolean;

  constructor(value: ?Object) {
    if (this._isPrimitive(value)) {
      throw new TypeError(
        [
          'Primitives cannot leak memory.',
          'You passed a ' + typeof value + ': <' + prettyFormat(value) + '>',
        ].join(' '),
      );
    }

    weak(value, () => (this._isReferenceBeingHeld = false));
    this._isReferenceBeingHeld = true;

    // Ensure value is not leaked by the closure created by the "weak" callback.
    value = null;
  }

  isLeaking(): boolean {
    this._runGarbageCollector();

    return this._isReferenceBeingHeld;
  }

  _runGarbageCollector() {
    const isGarbageCollectorHidden = !global.gc;

    // GC is usually hidden, so we have to expose it before running.
    v8.setFlagsFromString('--expose-gc');
    vm.runInNewContext('gc')();

    // The GC was not initially exposed, so let's hide it again.
    if (isGarbageCollectorHidden) {
      v8.setFlagsFromString('--no-expose-gc');
    }
  }

  _isPrimitive(value: any): boolean {
    return value === null || PRIMITIVE_TYPES.has(typeof value);
  }
}
