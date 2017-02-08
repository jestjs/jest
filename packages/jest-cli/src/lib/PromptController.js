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

class PromptController {
  entering: boolean;
  value: string;
  onChange: Function;
  onSuccess: Function;
  onCancel: Function;

  prompt(
    onChange: Function,
    onSuccess: Function,
    onCancel: Function,
  ) {
    this.entering = true;
    this.value = '';
    this.onChange = onChange;
    this.onSuccess = onSuccess;
    this.onCancel = onCancel;

    onChange(this.value);
  }

  put(
    key: string,
  ) {
    switch (key) {
      case KEYS.ENTER:
        this.entering = false;
        this.onSuccess(this.value);
        break;
      case KEYS.ESCAPE:
        this.entering = false;
        this.onCancel(this.value);
        break;
      case KEYS.ARROW_DOWN:
      case KEYS.ARROW_LEFT:
      case KEYS.ARROW_RIGHT:
      case KEYS.ARROW_UP:
        break;
      default:
        const char = new Buffer(key, 'hex').toString();

        this.value = key === KEYS.BACKSPACE
          ? this.value.slice(0, -1)
          : this.value + char;

        this.onChange(this.value);
        break;
    }
  }

  abort() {
    this.entering = false;
    this.value = '';
  }
}

module.exports = PromptController;
