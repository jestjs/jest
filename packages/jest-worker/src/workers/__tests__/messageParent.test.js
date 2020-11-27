/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import {PARENT_MESSAGE_CUSTOM} from '../../types';

const processSend = process.send;

let messageParent;
let mockWorkerThreads;

beforeEach(() => {
  mockWorkerThreads = {};
  process.send = jest.fn();
  jest.mock('worker_threads', () => mockWorkerThreads);
  messageParent = require('../messageParent').default;
});

afterEach(() => {
  jest.resetModules();
  // console.log(require('worker_threads'));
  process.send = processSend;
});

describe('with worker threads', () => {
  beforeEach(() => {
    mockWorkerThreads.parentPort = {
      postMessage: jest.fn(),
    };
  });

  it('cand send a message', () => {
    messageParent('some-message');
    expect(mockWorkerThreads.parentPort.postMessage).toHaveBeenCalledWith([
      PARENT_MESSAGE_CUSTOM,
      'some-message',
    ]);
  });

  it('removes circular references from the message being sent', () => {
    const circular = {ref: null, some: 'thing'};
    circular.ref = circular;
    messageParent(circular);
    expect(mockWorkerThreads.parentPort.postMessage).toHaveBeenCalledWith([
      PARENT_MESSAGE_CUSTOM,
      {
        ref: '[Circular]',
        some: 'thing',
      },
    ]);
  });
});

describe('without worker threads', () => {
  it('cand send a message', () => {
    messageParent('some-message');
    expect(process.send).toHaveBeenCalledWith([
      PARENT_MESSAGE_CUSTOM,
      'some-message',
    ]);
  });

  it('removes circular references from the message being sent', () => {
    const circular = {ref: null, some: 'thing'};
    circular.ref = circular;
    messageParent(circular);
    expect(process.send).toHaveBeenCalledWith([
      PARENT_MESSAGE_CUSTOM,
      {
        ref: '[Circular]',
        some: 'thing',
      },
    ]);
  });
});
