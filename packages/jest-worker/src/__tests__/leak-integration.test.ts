/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import {join} from 'path';
import {writeFileSync} from 'graceful-fs';
import LeakDetector from 'jest-leak-detector';
import {Worker} from '../..';

let workerFile!: string;
beforeAll(() => {
  workerFile = join(tmpdir(), 'baz.js');
  writeFileSync(workerFile, `module.exports.fn = () => {};`);
});

let worker!: Worker;
beforeEach(() => {
  worker = new Worker(workerFile, {
    enableWorkerThreads: true,
    exposedMethods: ['fn'],
  });
});
afterEach(async () => {
  await worker.end();
});

it('does not retain arguments after a task finished', async () => {
  let leakDetector!: LeakDetector;
  await new Promise(resolve => {
    const obj = {};
    leakDetector = new LeakDetector(obj);
    (worker as any).fn(obj).then(resolve);
  });

  expect(await leakDetector.isLeaking()).toBe(false);
});
