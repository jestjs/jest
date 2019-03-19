/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ScrollOptions} from '../types';
import {KEYS} from '../constants';

export default class Prompt {
  private _entering: boolean;
  private _value: string;
  private _onChange: () => void;
  private _onSuccess: (value: string) => void;
  private _onCancel: (value: string) => void;
  private _offset: number;
  private _promptLength: number;
  private _selection: string | null;

  constructor() {
    // Copied from `enter` to satisfy TS
    this._entering = true;
    this._value = '';
    this._selection = null;
    this._offset = -1;
    this._promptLength = 0;

    this._onChange = () => {};
    this._onSuccess = () => {};
    this._onCancel = () => {};
  }

  private _onResize = () => {
    this._onChange();
  };

  enter(
    onChange: (pattern: string, options: ScrollOptions) => void,
    onSuccess: (pattern: string) => void,
    onCancel: () => void,
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
        this._value =
          key === KEYS.BACKSPACE ? this._value.slice(0, -1) : this._value + key;
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
