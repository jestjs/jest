/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {QueueChildMessage} from './types';

export default class Queue {
  private data: Array<QueueChildMessage | null>;
  private offset: number;

  constructor() {
    this.data = [];
    this.offset = 0;
  }

  public push = (item: QueueChildMessage) => this.data.push(item);

  public shift = () => {
    const item = this.data[this.offset];

    this.data[this.offset] = null;
    this.offset++;

    return item;
  };

  public flush = () => {
    if (this.offset === this.data.length) {
      this.data = [];
      this.offset = 0;
    }
  };
}
