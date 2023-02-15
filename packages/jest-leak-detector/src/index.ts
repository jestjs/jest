/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference lib="es2021.WeakRef" />

import {promisify} from 'util';
import {setFlagsFromString} from 'v8';
import {runInNewContext} from 'vm';
import {isPrimitive} from 'jest-get-type';
import {format as prettyFormat} from 'pretty-format';

const tick = promisify(setImmediate);

export default class LeakDetector {
  private _isReferenceBeingHeld: boolean;
  private readonly _finalizationRegistry?: FinalizationRegistry<undefined>;

  constructor(value: unknown) {
    if (isPrimitive(value)) {
      throw new TypeError(
        [
          'Primitives cannot leak memory.',
          `You passed a ${typeof value}: <${prettyFormat(value)}>`,
        ].join(' '),
      );
    }

    // When `_finalizationRegistry` is GCed the callback we set will no longer be called,
    this._finalizationRegistry = new FinalizationRegistry(() => {
      this._isReferenceBeingHeld = false;
    });
    this._finalizationRegistry.register(value as object, undefined);

    this._isReferenceBeingHeld = true;

    // Ensure value is not leaked by the closure created by the "weak" callback.
    value = null;
  }

  async isLeaking(): Promise<boolean> {
    this._runGarbageCollector();

    // wait some ticks to allow GC to run properly, see https://github.com/nodejs/node/issues/34636#issuecomment-669366235
    for (let i = 0; i < 10; i++) {
      await tick();
    }

    return this._isReferenceBeingHeld;
  }

  private _runGarbageCollector() {
    // @ts-expect-error: not a function on `globalThis`
    const isGarbageCollectorHidden = globalThis.gc == null;

    // GC is usually hidden, so we have to expose it before running.
    setFlagsFromString('--expose-gc');
    runInNewContext('gc')();

    // The GC was not initially exposed, so let's hide it again.
    if (isGarbageCollectorHidden) {
      setFlagsFromString('--no-expose-gc');
    }
  }
}
