/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import createProcessObject from './createProcessObject';
import deepCyclicCopy from './deepCyclicCopy';
import {
  type DeletionMode,
  initializeGarbageCollectionUtils,
} from './garbage-collection-utils';

const DTRACE = Object.keys(globalThis).filter(key => key.startsWith('DTRACE'));

export default function installCommonGlobals(
  globalObject: typeof globalThis,
  globals: Config.ConfigGlobals,
  garbageCollectionDeletionMode?: DeletionMode,
): typeof globalThis & Config.ConfigGlobals {
  globalObject.process = createProcessObject();

  const symbol = globalObject.Symbol as unknown as SymbolConstructor;
  // Keep a reference to some globals that Jest needs
  Object.defineProperties(globalObject, {
    [symbol.for('jest-native-promise')]: {
      enumerable: false,
      value: Promise,
      writable: false,
    },
    [symbol.for('jest-native-now')]: {
      enumerable: false,
      value: globalObject.Date.now.bind(globalObject.Date),
      writable: false,
    },
    [symbol.for('jest-native-read-file')]: {
      enumerable: false,
      value: fs.readFileSync.bind(fs),
      writable: false,
    },
    [symbol.for('jest-native-write-file')]: {
      enumerable: false,
      value: fs.writeFileSync.bind(fs),
      writable: false,
    },
    [symbol.for('jest-native-exists-file')]: {
      enumerable: false,
      value: fs.existsSync.bind(fs),
      writable: false,
    },
    'jest-symbol-do-not-touch': {
      enumerable: false,
      value: symbol,
      writable: false,
    },
  });

  // Forward some APIs.
  for (const dtrace of DTRACE) {
    // @ts-expect-error: no index
    globalObject[dtrace] = function (...args: Array<any>) {
      // @ts-expect-error: no index
      return globalThis[dtrace].apply(this, args);
    };
  }

  if (garbageCollectionDeletionMode) {
    initializeGarbageCollectionUtils(
      globalObject,
      garbageCollectionDeletionMode,
    );
  }

  return Object.assign(globalObject, deepCyclicCopy(globals));
}
