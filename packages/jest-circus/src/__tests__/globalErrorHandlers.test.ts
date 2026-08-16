/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'node:events';
import type * as Process from 'node:process';
import {
  injectGlobalErrorHandlers,
  restoreGlobalErrorHandlers,
} from '../globalErrorHandlers';

const errorEvents = [
  'uncaughtException',
  'unhandledRejection',
  'rejectionHandled',
] as const;

// Circus runs inside the VM, where the ambient `process` is the sandbox copy
// made by `createProcessObject` — a different emitter from the `parentProcess`
// the handlers are installed on. A plain emitter stands in for the parent.
const makeParentProcess = () => {
  const emitter = new EventEmitter();
  return {emitter, parentProcess: emitter as unknown as typeof Process};
};

describe('injectGlobalErrorHandlers', () => {
  test('snapshots the listeners of the parent process, not the ambient one', () => {
    const {emitter, parentProcess} = makeParentProcess();
    const parentListener = () => {};
    for (const event of errorEvents) {
      emitter.on(event, parentListener);
    }

    const originalHandlers = injectGlobalErrorHandlers(parentProcess);

    expect(originalHandlers.uncaughtException).toEqual([parentListener]);
    expect(originalHandlers.unhandledRejection).toEqual([parentListener]);
    expect(originalHandlers.rejectionHandled).toEqual([parentListener]);

    for (const event of errorEvents) {
      expect(emitter.listeners(event)).not.toContain(parentListener);
      expect(emitter.listeners(event)).toHaveLength(1);
    }
  });

  test('restores the parent process listeners it replaced', () => {
    const {emitter, parentProcess} = makeParentProcess();
    const parentListener = () => {};
    for (const event of errorEvents) {
      emitter.on(event, parentListener);
    }

    restoreGlobalErrorHandlers(
      parentProcess,
      injectGlobalErrorHandlers(parentProcess),
    );

    for (const event of errorEvents) {
      expect(emitter.listeners(event)).toEqual([parentListener]);
    }
  });

  test('keeps a restored `once` listener one-shot', () => {
    const {emitter, parentProcess} = makeParentProcess();
    let calls = 0;
    emitter.once('uncaughtException', () => {
      calls++;
    });

    restoreGlobalErrorHandlers(
      parentProcess,
      injectGlobalErrorHandlers(parentProcess),
    );

    emitter.emit('uncaughtException', new Error('first'));
    emitter.emit('uncaughtException', new Error('second'));

    expect(calls).toBe(1);
    expect(emitter.listeners('uncaughtException')).toHaveLength(0);
  });

  test('does not leak listeners added inside the sandbox onto the parent process', () => {
    const {emitter, parentProcess} = makeParentProcess();
    const originalHandlers = injectGlobalErrorHandlers(parentProcess);

    // A `setupFiles` script registering on the sandbox `process` must not be
    // restored onto the parent.
    const sandboxListener = () => {};
    for (const event of errorEvents) {
      process.on(event, sandboxListener);
    }

    try {
      restoreGlobalErrorHandlers(parentProcess, originalHandlers);

      for (const event of errorEvents) {
        expect(emitter.listeners(event)).toHaveLength(0);
      }
    } finally {
      for (const event of errorEvents) {
        process.removeListener(event, sandboxListener);
      }
    }
  });
});
