/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {QueueChildMessage} from './types';

export default class Queue {
  private data: Set<QueueChildMessage | null>;
  private iterator: IterableIterator<QueueChildMessage | null>;

  constructor() {
    this.data = new Set();
    this.iterator = this.data.values();
  }

  push(item: QueueChildMessage) {
    return this.data.add(item);
  }

  shift() {
    const item = this.iterator.next();

    if (item.done) {
      this.data.clear();
      this.iterator = this.data.values();
    }

    return item.value;
  }
}
