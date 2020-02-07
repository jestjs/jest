/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Queue from '../Queue';

const createQueueMessage = () => ({
  onEnd: () => {},
  onStart: () => {},
  request: [],
});

describe('Queue', () => {
  it('push and shift all by ordered', () => {
    const msg1 = createQueueMessage();
    const msg2 = createQueueMessage();
    const msg3 = createQueueMessage();

    const samples = [msg1, msg2, msg3];

    const queue = new Queue();
    samples.forEach(item => {
      queue.push(item);
    });

    samples.forEach(item => {
      expect(queue.shift()).toEqual(item);
    });
  });

  it('push and shift not ordered', () => {
    const msg1 = createQueueMessage();
    const msg2 = createQueueMessage();
    const msg3 = createQueueMessage();

    const actions = [
      {type: 'push', value: msg1},
      {type: 'push', value: msg2},
      {type: 'shift', value: msg1},
      {type: 'push', value: msg3},
      {type: 'shift', value: msg2},
      {type: 'shift', value: msg3},
    ];

    const queue = new Queue();
    actions.forEach(action => {
      if (action.type === 'shift') {
        expect(queue[action.type]()).toEqual(action.value);
      } else {
        queue[action.type](action.value);
      }
    });
  });
});
