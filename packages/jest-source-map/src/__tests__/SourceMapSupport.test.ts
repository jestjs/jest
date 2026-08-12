/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {SourceMapSupport} from '../SourceMapSupport';

jest.mock('graceful-fs');

// Built with `path` so the expectations survive on Windows, where the resolved
// source of a mapping comes back with backslashes.
const buildDir = path.resolve(path.sep, 'repo', 'build');
const generatedPath = path.join(buildDir, 'out.js');
const originalPath = path.join(buildDir, 'input.ts');
const mapPath = path.resolve(path.sep, 'cache', 'out.js.map');

// Generated line 2 has two mapped columns: column 0 carries the name
// `toBeTruthy` and column 20 carries no name at all.
const decodedMap = {
  file: 'out.js',
  mappings: [
    [],
    [
      [0, 0, 9, 2, 0],
      [20, 0, 11, 4],
    ],
  ],
  names: ['toBeTruthy'],
  sources: ['input.ts'],
  version: 3,
};

type FrameSpec = {
  columnNumber?: number | null;
  evalOrigin?: string;
  fileName?: string | null;
  functionName?: string | null;
  isConstructor?: boolean;
  isEval?: boolean;
  isNative?: boolean;
  isToplevel?: boolean;
  lineNumber?: number | null;
  methodName?: string | null;
  typeName?: string | null;
};

const callSitePrototype = {
  getColumnNumber(this: {spec: FrameSpec}) {
    return this.spec.columnNumber ?? null;
  },
  getEvalOrigin(this: {spec: FrameSpec}) {
    return this.spec.evalOrigin;
  },
  getFileName(this: {spec: FrameSpec}) {
    return this.spec.fileName ?? null;
  },
  getFunctionName(this: {spec: FrameSpec}) {
    return this.spec.functionName ?? null;
  },
  getLineNumber(this: {spec: FrameSpec}) {
    return this.spec.lineNumber ?? null;
  },
  getMethodName(this: {spec: FrameSpec}) {
    return this.spec.methodName ?? null;
  },
  getScriptNameOrSourceURL(this: {spec: FrameSpec}) {
    return this.spec.fileName ?? null;
  },
  getTypeName(this: {spec: FrameSpec}) {
    return this.spec.typeName ?? null;
  },
  isConstructor(this: {spec: FrameSpec}) {
    return this.spec.isConstructor ?? false;
  },
  isEval(this: {spec: FrameSpec}) {
    return this.spec.isEval ?? false;
  },
  isNative(this: {spec: FrameSpec}) {
    return this.spec.isNative ?? false;
  },
  isToplevel(this: {spec: FrameSpec}) {
    return this.spec.isToplevel ?? false;
  },
  toString() {
    return 'UNFORMATTED';
  },
};

function createCallSite(spec: FrameSpec): NodeJS.CallSite {
  const site: unknown = Object.create(callSitePrototype);

  (site as {spec: FrameSpec}).spec = spec;

  return site as NodeJS.CallSite;
}

// A frame in the mapped file, sitting on the segment that carries a name.
function mappedFrame(spec: FrameSpec = {}): NodeJS.CallSite {
  return createCallSite({
    columnNumber: 1,
    fileName: generatedPath,
    lineNumber: 2,
    ...spec,
  });
}

type StackFormatter = (error: Error, stack: Array<NodeJS.CallSite>) => unknown;

// `@types/node` declares `prepareStackTrace` as a method, so reading it off
// `Error` directly trips `unbound-method`.
function currentFormatter(): StackFormatter {
  return (Error as unknown as {prepareStackTrace: StackFormatter})
    .prepareStackTrace;
}

function format(error: Error, stack: Array<NodeJS.CallSite>): string {
  return currentFormatter()(error, stack) as string;
}

function frameOf(error: Error, frame: NodeJS.CallSite): string {
  return format(error, [frame]).split('\n    at ')[1];
}

const sourceMapSupport = new SourceMapSupport();
const originalPrepareStackTrace = currentFormatter();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fs.existsSync).mockReturnValue(true);
  jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(decodedMap));
  sourceMapSupport.install(new Map([[generatedPath, mapPath]]));
});

afterEach(() => {
  (Error as {prepareStackTrace?: unknown}).prepareStackTrace =
    originalPrepareStackTrace;
});

describe('the error header', () => {
  test('is the name and message', () => {
    expect(format(new TypeError('boom'), [])).toBe('TypeError: boom');
  });

  // `formatResultsErrors` snapshots depend on the trailing separator.
  test('keeps the separator when there is no message', () => {
    expect(format(new Error(''), [])).toBe('Error: ');
  });
});

describe('positions', () => {
  test('are translated back to the original source', () => {
    const frame = mappedFrame({columnNumber: 21, isToplevel: true});

    expect(frameOf(new Error('x'), frame)).toBe(`${originalPath}:12:5`);
  });

  test('stay at the generated position when nothing maps to them', () => {
    const frame = mappedFrame({isToplevel: true, lineNumber: 40});

    expect(frameOf(new Error('x'), frame)).toBe(`${generatedPath}:40:1`);
  });
});

describe('function names', () => {
  // The name at the frame's own mapped position is the identifier being called
  // there, which annotates the frame with the call on that line. Taking the
  // caller's position instead would be spec-correct and much less readable.
  test('come from the frame’s own mapped position', () => {
    const frame = mappedFrame({functionName: 'throws', typeName: 'Object'});

    expect(frameOf(new Error('x'), frame)).toBe(
      `Object.toBeTruthy (${originalPath}:10:3)`,
    );
  });

  test('fall back to V8’s name where the map has none', () => {
    const frame = mappedFrame({
      columnNumber: 21,
      functionName: 'throws',
      typeName: 'Object',
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      `Object.throws (${originalPath}:12:5)`,
    );
  });

  test('are omitted for a toplevel frame with no name anywhere', () => {
    const frame = mappedFrame({columnNumber: 21, isToplevel: true});

    expect(frameOf(new Error('x'), frame)).toBe(`${originalPath}:12:5`);
  });

  test('fall back to the type and method name', () => {
    const frame = mappedFrame({
      columnNumber: 21,
      methodName: 'run',
      typeName: 'Runner',
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      `Runner.run (${originalPath}:12:5)`,
    );
  });
});

describe('frame shapes', () => {
  test('a method reached under another name gets an `as` suffix', () => {
    const frame = mappedFrame({
      columnNumber: 21,
      functionName: 'requireModule',
      methodName: '_onTimeout',
      typeName: 'Timeout',
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      `Timeout.requireModule [as _onTimeout] (${originalPath}:12:5)`,
    );
  });

  test('a method called by its own name gets no `as` suffix', () => {
    const frame = mappedFrame({
      columnNumber: 21,
      functionName: 'log',
      methodName: 'log',
      typeName: 'Console',
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      `Console.log (${originalPath}:12:5)`,
    );
  });

  test('a constructor call is prefixed with `new`', () => {
    const frame = mappedFrame({
      columnNumber: 21,
      functionName: 'Thing',
      isConstructor: true,
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      `new Thing (${originalPath}:12:5)`,
    );
  });

  test('a native frame is left alone', () => {
    const frame = createCallSite({isNative: true});

    expect(frameOf(new Error('x'), frame)).toBe('UNFORMATTED');
  });

  test('an eval frame keeps its mapped origin', () => {
    const frame = createCallSite({
      evalOrigin: `eval at run (${generatedPath}:2:1)`,
      isEval: true,
      isToplevel: true,
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      `eval at run (${originalPath}:10:3), <anonymous>`,
    );
  });
});

describe('install', () => {
  test('swaps the cache for each test file', () => {
    const other = path.join(buildDir, 'other.js');

    sourceMapSupport.install(new Map([[other, mapPath]]));

    const frame = createCallSite({
      columnNumber: 1,
      fileName: other,
      isToplevel: true,
      lineNumber: 2,
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      `toBeTruthy (${originalPath}:10:3)`,
    );
  });

  // A stray timer or floating promise reports after teardown, and that stack
  // has to still be mapped.
  test('keeps the formatter in place so later stacks stay mapped', () => {
    const installed = currentFormatter();

    sourceMapSupport.install(new Map());

    expect(installed).not.toBe(originalPrepareStackTrace);
    expect(currentFormatter()).toBe(installed);
  });

  test('warns once when a map cannot be parsed', () => {
    const consoleWarnMock = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const brokenMapPath = path.resolve(path.sep, 'cache', 'broken.js.map');

    jest.mocked(fs.readFileSync).mockReturnValue('{not json');
    sourceMapSupport.install(new Map([[generatedPath, brokenMapPath]]));

    expect(frameOf(new Error('x'), mappedFrame())).toContain(generatedPath);
    expect(frameOf(new Error('y'), mappedFrame())).toContain(generatedPath);
    expect(consoleWarnMock).toHaveBeenCalledTimes(1);
    expect(consoleWarnMock).toHaveBeenCalledWith(
      `Failed to parse the source map at ${brokenMapPath} for ${generatedPath}; its stack frames stay untranslated.`,
    );
  });

  test('`suppressWarnings` silences the unparsable-map warning', () => {
    const consoleWarnMock = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const brokenMapPath = path.resolve(path.sep, 'cache', 'broken2.js.map');

    jest.mocked(fs.readFileSync).mockReturnValue('{not json');
    sourceMapSupport.install(new Map([[generatedPath, brokenMapPath]]), {
      suppressWarnings: true,
    });

    expect(frameOf(new Error('x'), mappedFrame())).toContain(generatedPath);
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });
});

describe('getCallsite', () => {
  test('returns the caller’s frame', () => {
    const site = sourceMapSupport.getCallsite(0, new Map());

    expect(site.getFileName()).toBe(__filename);
    expect(site.getColumnNumber()).toEqual(expect.any(Number));
    expect(site.getLineNumber()).toEqual(expect.any(Number));
  });
});
