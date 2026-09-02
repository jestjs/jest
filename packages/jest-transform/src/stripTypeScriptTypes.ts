/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as nodeModule from 'node:module';
import * as path from 'node:path';
import {invariant, isError} from 'jest-util';

const nodeStripTypeScriptTypes = (
  nodeModule as {
    // `stripTypeScriptTypes` is in Node v22.13+/v23.2+, not yet typed in @types/node@18
    stripTypeScriptTypes?: (code: string, options: {mode: 'strip'}) => string;
  }
).stripTypeScriptTypes;

export const supportsTypeStripping =
  typeof nodeStripTypeScriptTypes === 'function';

// `.tsx` is absent on purpose - Node's strip-only mode cannot parse JSX.
const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);

let warningBurnt = false;

// Node emits a one-off `ExperimentalWarning` the first time the API is called.
// Jest owns the decision to call it, so burn the warning on a throwaway input
// rather than printing it out of every worker on every run. Loading the
// TypeScript parser costs around 20ms, so this waits for a real caller instead
// of running when the module is imported.
function burnExperimentalWarning(
  strip: (code: string, options: {mode: 'strip'}) => string,
) {
  warningBurnt = true;

  // Restored through its descriptor so `process` gets the same function object
  // back, rather than a bound copy.
  const emitWarning = Object.getOwnPropertyDescriptor(process, 'emitWarning')!;
  process.emitWarning = () => undefined;
  try {
    strip('', {mode: 'strip'});
  } finally {
    Object.defineProperty(process, 'emitWarning', emitWarning);
  }
}

export function canStripTypes(filename: string): boolean {
  return (
    supportsTypeStripping && TYPESCRIPT_EXTENSIONS.has(path.extname(filename))
  );
}

export function stripTypes(code: string, filename: string): string {
  invariant(nodeStripTypeScriptTypes, 'Node.js cannot strip TypeScript types');

  if (!warningBurnt) {
    burnExperimentalWarning(nodeStripTypeScriptTypes);
  }

  try {
    return nodeStripTypeScriptTypes(code, {mode: 'strip'});
  } catch (error) {
    const reason = isError(error) ? error.message : String(error);

    throw new Error(
      `jest: failed to strip TypeScript types from ${filename}\n\n${reason}\n\n` +
        'Node.js only erases type annotations - it cannot compile TypeScript features that emit code, such as `enum`, `namespace` and parameter properties. Configure a `transform` using `@babel/preset-typescript` or `ts-jest` to handle this file.',
      {cause: error},
    );
  }
}
