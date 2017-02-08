/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const {KEYS} = require('../constants');

class Prompt {
  _entering: boolean;
  _value: string;
  _onChange: Function;
  _onSuccess: Function;
  _onCancel: Function;

  prompt(
    onChange: Function,
    onSuccess: Function,
    onCancel: Function,
  ) {
    this._entering = true;
    this._value = '';
    this._onChange = onChange;
    this._onSuccess = onSuccess;
    this._onCancel = onCancel;

    onChange(this._value);
  }

  put(
    key: string,
  ) {
    switch (key) {
      case KEYS.ENTER:
        this._entering = false;
        this._onSuccess(this._value);
        break;
      case KEYS.ESCAPE:
        this._entering = false;
        this._onCancel(this._value);
        break;
      case KEYS.ARROW_DOWN:
      case KEYS.ARROW_LEFT:
      case KEYS.ARROW_RIGHT:
      case KEYS.ARROW_UP:
        break;
      default:
        const char = new Buffer(key, 'hex').toString();

        this._value = key === KEYS.BACKSPACE
          ? this._value.slice(0, -1)
          : this._value + char;

        this._onChange(this._value);
        break;
    }
  }

  abort() {
    this._entering = false;
    this._value = '';
  }

  isEntering() {
    return this._entering;
  }
}

module.exports = Prompt;
