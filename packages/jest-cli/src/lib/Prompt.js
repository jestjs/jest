/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {ScrollOptions} from './scroll_list';

import {KEYS} from '../constants';

export default class Prompt {
  _entering: boolean;
  _value: string;
  _onChange: Function;
  _onSuccess: Function;
  _onCancel: Function;
  _offset: number;
  _promptLength: number;
  _selection: string | null;

  constructor() {
    (this: any)._onResize = this._onResize.bind(this);
  }

  _onResize() {
    this._onChange(this._value);
  }

  enter(
    onChange: (pattern: string, options: ScrollOptions) => void,
    onSuccess: Function,
    onCancel: Function,
  ) {
    this._entering = true;
    this._value = '';
    this._onSuccess = onSuccess;
    this._onCancel = onCancel;
    this._selection = null;
    this._offset = -1;
    this._promptLength = 0;
    this._onChange = () =>
      onChange(this._value, {
        max: 10,
        offset: this._offset,
      });

    this._onChange();

    process.stdout.on('resize', this._onResize);
  }

  setPromptLength(length: number) {
    this._promptLength = length;
  }

  setPromptSelection(selected: string) {
    this._selection = selected;
  }

  put(key: string) {
    switch (key) {
      case KEYS.ENTER:
        this._entering = false;
        this._onSuccess(this._selection || this._value);
        this.abort();
        break;
      case KEYS.ESCAPE:
        this._entering = false;
        this._onCancel(this._value);
        this.abort();
        break;
      case KEYS.ARROW_DOWN:
        this._offset = Math.min(this._offset + 1, this._promptLength - 1);
        this._onChange();
        break;
      case KEYS.ARROW_UP:
        this._offset = Math.max(this._offset - 1, -1);
        this._onChange();
        break;
      case KEYS.ARROW_LEFT:
      case KEYS.ARROW_RIGHT:
        break;
      default:
        const char = new Buffer(key, 'hex').toString();

        this._value =
          key === KEYS.BACKSPACE
            ? this._value.slice(0, -1)
            : this._value + char;
        this._offset = -1;
        this._selection = null;
        this._onChange();
        break;
    }
  }

  abort() {
    this._entering = false;
    this._value = '';
    process.stdout.removeListener('resize', this._onResize);
  }

  isEntering() {
    return this._entering;
  }
}
