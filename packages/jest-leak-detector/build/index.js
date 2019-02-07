/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function _prettyFormat() {
  const data = _interopRequireDefault(require('pretty-format'));

  _prettyFormat = function _prettyFormat() {
    return data;
  };

  return data;
}

function _v() {
  const data = _interopRequireDefault(require('v8'));

  _v = function _v() {
    return data;
  };

  return data;
}

function _vm() {
  const data = _interopRequireDefault(require('vm'));

  _vm = function _vm() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

class _default {
  constructor(value) {
    if (this._isPrimitive(value)) {
      throw new TypeError(
        [
          'Primitives cannot leak memory.',
          'You passed a ' +
            typeof value +
            ': <' +
            (0, _prettyFormat().default)(value) +
            '>'
        ].join(' ')
      );
    }

    let weak;

    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      weak = require('weak');
    } catch (err) {
      if (!err || err.code !== 'MODULE_NOT_FOUND') {
        throw err;
      }

      throw new Error(
        'The leaking detection mechanism requires the "weak" package to be installed and work. ' +
          'Please install it as a dependency on your main project'
      );
    }

    weak(value, () => (this._isReferenceBeingHeld = false));
    this._isReferenceBeingHeld = true; // Ensure value is not leaked by the closure created by the "weak" callback.

    value = null;
  }

  isLeaking() {
    this._runGarbageCollector();

    return this._isReferenceBeingHeld;
  }

  _runGarbageCollector() {
    const isGarbageCollectorHidden = !global.gc; // GC is usually hidden, so we have to expose it before running.

    _v().default.setFlagsFromString('--expose-gc');

    _vm().default.runInNewContext('gc')(); // The GC was not initially exposed, so let's hide it again.

    if (isGarbageCollectorHidden) {
      _v().default.setFlagsFromString('--no-expose-gc');
    }
  }

  _isPrimitive(value) {
    return value !== Object(value);
  }
}

exports.default = _default;
