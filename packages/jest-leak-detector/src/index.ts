/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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
  private _finalizationRegistry?: FinalizationRegistry<undefined>;

  constructor(value: unknown) {
    if (isPrimitive(value)) {
      throw new TypeError(
        [
          'Primitives cannot leak memory.',
          `You passed a ${typeof value}: <${prettyFormat(value)}>`,
        ].join(' '),
      );
    }

    // TODO: Remove the `if` and `weak-napi` when we drop node 12, as v14 supports FinalizationRegistry
    if (globalThis.FinalizationRegistry) {
      // When `_finalizationRegistry` is GCed the callback we set will no longer be called,
      // so we need to assign it to `this` to keep it referenced
      this._finalizationRegistry = new FinalizationRegistry(() => {
        this._isReferenceBeingHeld = false;
      });

      this._finalizationRegistry.register(value as object, undefined);
    } else {
      let weak: typeof import('weak-napi');

      try {
        // eslint-disable-next-line import/no-extraneous-dependencies
        weak = require('weak-napi');
      } catch (err: any) {
        if (!err || err.code !== 'MODULE_NOT_FOUND') {
          throw err;
        }

        throw new Error(
          'The leaking detection mechanism requires newer version of node that supports ' +
            'FinalizationRegistry, update your node or install the "weak-napi" package' +
            'which support current node version as a dependency on your main project.',
        );
      }

      weak(value as object, () => (this._isReferenceBeingHeld = false));
    }

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
