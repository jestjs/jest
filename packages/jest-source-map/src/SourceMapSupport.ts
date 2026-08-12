/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type TraceMap, originalPositionFor} from '@jridgewell/trace-mapping';
// TODO: replace with `util.getCallSites()`, whose `columnNumber` landed in
// Node 22.14 — the floor is still 18.
import callsites from 'callsites';
import {SourceMapCache, mapSourcePosition} from './SourceMapCache';
import {nodeFileReader} from './nodeFileReader';
import type {SourceMapRegistry} from './types';

export interface SourceMapSupportInstallOptions {
  /** Turns off the once-per-map warning about maps that cannot be parsed. */
  suppressWarnings?: boolean;
}

// Copied from https://github.com/rexxars/sourcemap-decorate-callsites/blob/5b9735a156964973a75dc62fd2c7f0c1975458e8/lib/index.js#L113-L158
export const addSourceMapConsumer = (
  callsite: callsites.CallSite,
  tracer: TraceMap,
): void => {
  const getLineNumber = callsite.getLineNumber.bind(callsite);
  const getColumnNumber = callsite.getColumnNumber.bind(callsite);
  let position: ReturnType<typeof originalPositionFor> | null = null;

  function getPosition() {
    if (position != null) {
      return position;
    }

    // The needle is zero-based while V8 counts columns from one, so looking up
    // V8's number directly finds the segment one column to the right.
    const line = getLineNumber();
    const column = (getColumnNumber() ?? 1) - 1;

    // The tracer throws on out-of-range needles.
    position =
      line == null || line < 1 || column < 0
        ? {column: null, line: null, name: null, source: null}
        : originalPositionFor(tracer, {column, line});

    return position;
  }

  Object.defineProperties(callsite, {
    getColumnNumber: {
      value() {
        // TODO: return `column + 1` in Jest 31, so this matches V8 and
        // jest-circus. Reported zero-based until then, which is what
        // `--testLocationInResults` documents for jest-jasmine2, and changing
        // it breaks anyone reading that field. An unmapped position falls back
        // to V8's one-based column, as it always has — the Jest 31 change
        // turns that fallback consistent instead of one off.
        const {column} = getPosition();

        return column ?? getColumnNumber();
      },
      writable: false,
    },
    getLineNumber: {
      value() {
        const {line} = getPosition();

        return line ?? getLineNumber();
      },
      writable: false,
    },
  });
};

// V8 treats an empty name as no name at all. Every fallback below has to keep
// doing the same, which is why none of them can become `??`.
function isPresent(value: string | null | undefined): value is string {
  return value != null && value !== '';
}

function orAnonymous(value: string | null | undefined): string {
  return isPresent(value) ? value : '<anonymous>';
}

function frameToString(frame: NodeJS.CallSite): string {
  return (frame as unknown as {toString(): string}).toString();
}

// Copied almost verbatim from the V8 source, by way of `source-map-support`.
// Every non-native frame is rendered through this rather than through V8's own
// `CallSite#toString`, so it decides the exact shape of every stack frame Jest
// prints.
function callSiteToString(this: NodeJS.CallSite): string {
  let fileLocation = '';
  let fileName;

  if (this.isNative()) {
    fileLocation = 'native';
  } else {
    fileName = this.getScriptNameOrSourceURL();

    if (!isPresent(fileName) && this.isEval()) {
      fileLocation = `${this.getEvalOrigin() ?? ''}, `;
    }

    // Source code does not originate from a file and is not native, but we can
    // still get the source position inside the source string, e.g. in an eval
    // string.
    fileLocation += orAnonymous(fileName);

    const lineNumber = this.getLineNumber();

    if (lineNumber != null) {
      fileLocation += `:${lineNumber}`;

      const columnNumber = this.getColumnNumber();

      if (columnNumber != null && columnNumber !== 0) {
        fileLocation += `:${columnNumber}`;
      }
    }
  }

  let line = '';
  const functionName = this.getFunctionName();
  const isConstructor = this.isConstructor();
  const isMethodCall = !(this.isToplevel() || isConstructor);

  if (isMethodCall) {
    const typeName = this.getTypeName();
    const methodName = this.getMethodName();

    if (isPresent(functionName)) {
      if (isPresent(typeName) && !functionName.startsWith(typeName)) {
        line += `${typeName}.`;
      }

      line += functionName;

      // Skips the suffix when the function name already is the method name:
      // both sides are -1 then.
      if (
        isPresent(methodName) &&
        functionName.indexOf(`.${methodName}`) !==
          functionName.length - methodName.length - 1
      ) {
        line += ` [as ${methodName}]`;
      }
    } else {
      line += `${String(typeName)}.${orAnonymous(methodName)}`;
    }
  } else if (isConstructor) {
    line += `new ${orAnonymous(functionName)}`;
  } else if (isPresent(functionName)) {
    line += functionName;
  } else {
    return fileLocation;
  }

  return `${line} (${fileLocation})`;
}

function cloneCallSite(frame: NodeJS.CallSite): NodeJS.CallSite {
  const clone: Record<string, unknown> = {};
  const source = frame as unknown as Record<string, unknown>;

  for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(frame))) {
    // Resolved at call time rather than now, so that accessors on the
    // prototype are not invoked here.
    clone[name] = /^(?:is|get)/.test(name)
      ? () => (source[name] as () => unknown).call(frame)
      : source[name];
  }

  clone.toString = callSiteToString;

  return clone as unknown as NodeJS.CallSite;
}

function mapEvalOrigin(cache: SourceMapCache, origin: string): string {
  // Most eval() calls are in this format
  const topLevel = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);

  if (topLevel) {
    const position = mapSourcePosition(cache, {
      column: Number(topLevel[4]) - 1,
      line: Number(topLevel[3]),
      source: topLevel[2],
    });

    return `eval at ${topLevel[1]} (${position.source}:${position.line}:${
      (position.column ?? 0) + 1
    })`;
  }

  // Parse nested eval() calls using recursion
  const nested = /^eval at ([^(]+) \((.+)\)$/.exec(origin);

  if (nested) {
    return `eval at ${nested[1]} (${mapEvalOrigin(cache, nested[2])})`;
  }

  // Make sure we still return useful information if we didn't find anything
  return origin;
}

function wrapCallSite(
  cache: SourceMapCache,
  frame: NodeJS.CallSite,
): NodeJS.CallSite {
  if (frame.isNative()) {
    return frame;
  }

  // Most call sites will return the source file from `getFileName()`, but code
  // passed to eval() ending in "//# sourceURL=..." will return the source file
  // from `getScriptNameOrSourceURL()` instead.
  const fileName = frame.getFileName();
  const source = isPresent(fileName)
    ? fileName
    : frame.getScriptNameOrSourceURL();

  if (isPresent(source)) {
    const column = frame.getColumnNumber();
    const position = mapSourcePosition(cache, {
      column: column == null ? null : column - 1,
      line: frame.getLineNumber(),
      source,
    });
    const mapped = cloneCallSite(frame);
    const originalGetFunctionName = mapped.getFunctionName.bind(mapped);

    // Deliberately the name at the frame's *own* mapped position, which is the
    // identifier being called there rather than the enclosing function. It
    // annotates each frame with the call on that line — `at Object.toBeTruthy
    // (assertionCount.test.js:12:17)` — which is what makes a failing
    // assertion's stack readable. Taking the caller's position instead would be
    // the spec-correct reading and would collapse these to `Object.<anonymous>`.
    mapped.getFunctionName = () =>
      isPresent(position.name) ? position.name : originalGetFunctionName();
    mapped.getFileName = () => position.source;
    mapped.getLineNumber = () => position.line;
    mapped.getColumnNumber = () =>
      position.column == null ? null : position.column + 1;
    mapped.getScriptNameOrSourceURL = () => position.source;

    return mapped;
  }

  // Code called using eval() needs special handling
  const origin = frame.isEval() ? frame.getEvalOrigin() : undefined;

  if (isPresent(origin)) {
    const mapped = cloneCallSite(frame);
    const mappedOrigin = mapEvalOrigin(cache, origin);

    mapped.getEvalOrigin = () => mappedOrigin;

    return mapped;
  }

  // If we get here then we were unable to change the source position
  return frame;
}

export class SourceMapSupport {
  private activeCache: SourceMapCache | null = null;
  private nullCache: SourceMapCache | null = null;
  private readonly cachesByRegistry = new WeakMap<
    SourceMapRegistry,
    SourceMapCache
  >();
  private suppressWarnings = false;
  private readonly reportedMapPaths = new Set<string>();
  // V8 calls the formatter unbound, and `install` compares it by identity, so
  // the bound copy has to be the same object every time.
  private readonly boundFormatStackTrace: (
    error: Error,
    stack: Array<NodeJS.CallSite>,
  ) => string;

  constructor() {
    this.boundFormatStackTrace = this.formatStackTrace.bind(this);
  }

  /**
   * Replaces `Error.prepareStackTrace` in the current realm, so `error.stack`
   * renders frames against the original sources.
   *
   * Stays installed for the lifetime of the worker — each call swaps in its
   * own cache. There is deliberately no `uninstall`: restoring V8's formatter
   * at teardown would leave an error thrown after the environment is torn
   * down pointing into the transformed file. Holding the cache does not
   * retain the environment: it only ever references path strings and parsed
   * source maps.
   */
  install(
    sourceMaps?: SourceMapRegistry | null,
    options: SourceMapSupportInstallOptions = {},
  ): void {
    this.suppressWarnings = options.suppressWarnings === true;
    this.activeCache = this.cacheFor(sourceMaps);

    if (Error.prepareStackTrace !== this.boundFormatStackTrace) {
      Error.prepareStackTrace = this.boundFormatStackTrace;
    }
  }

  /** One remapped `CallSite`, `level` frames above the caller. */
  getCallsite(
    level: number,
    sourceMaps?: SourceMapRegistry | null,
  ): callsites.CallSite {
    const levelAfterThisCall = level + 1;
    const stack = callsites()[levelAfterThisCall];
    const sourceMap = this.cacheFor(sourceMaps).get(stack.getFileName() ?? '');

    if (sourceMap != null) {
      addSourceMapConsumer(stack, sourceMap);
    }

    return stack;
  }

  // One cache per registry, so repeated lookups in a test file reuse it.
  private cacheFor(
    sourceMaps: SourceMapRegistry | null | undefined,
  ): SourceMapCache {
    if (sourceMaps == null) {
      this.nullCache ??= new SourceMapCache(
        null,
        nodeFileReader,
        (mapPath, generatedPath) =>
          this.reportUnparsable(mapPath, generatedPath),
      );

      return this.nullCache;
    }

    let cache = this.cachesByRegistry.get(sourceMaps);

    if (cache == null) {
      cache = new SourceMapCache(
        sourceMaps,
        nodeFileReader,
        (mapPath, generatedPath) =>
          this.reportUnparsable(mapPath, generatedPath),
      );
      this.cachesByRegistry.set(sourceMaps, cache);
    }

    return cache;
  }

  // A broken map silently leaves frames at their generated positions, which
  // reads as "source maps do not work". Say so, once per map.
  private reportUnparsable(mapPath: string, generatedPath: string): void {
    if (this.suppressWarnings || this.reportedMapPaths.has(mapPath)) {
      return;
    }

    this.reportedMapPaths.add(mapPath);

    const location =
      mapPath === generatedPath
        ? 'the inline source map'
        : `the source map at ${mapPath}`;

    console.warn(
      `Failed to parse ${location} for ${generatedPath}; its stack frames stay untranslated.`,
    );
  }

  private formatStackTrace(
    error: Error,
    stack: Array<NodeJS.CallSite>,
  ): string {
    const name = isPresent(error.name) ? error.name : 'Error';
    const message = error.message ?? '';
    const errorString = `${name}: ${message}`;
    const cache = this.activeCache;

    if (cache == null) {
      return (
        errorString +
        stack.map(frame => `\n    at ${frameToString(frame)}`).join('')
      );
    }

    return (
      errorString +
      stack
        .map(frame => `\n    at ${frameToString(wrapCallSite(cache, frame))}`)
        .join('')
    );
  }
}
