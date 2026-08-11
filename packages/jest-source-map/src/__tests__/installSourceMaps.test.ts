/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import {installSourceMaps, uninstallSourceMaps} from '../installSourceMaps';

jest.mock('graceful-fs');

const generatedPath = '/repo/build/out.js';
const mapPath = '/cache/out.js.map';

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
  return Object.assign(Object.create(callSitePrototype), {
    spec,
  }) as unknown as NodeJS.CallSite;
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

function format(error: Error, stack: Array<NodeJS.CallSite>): string {
  return Error.prepareStackTrace!(error, stack) as string;
}

function frameOf(error: Error, frame: NodeJS.CallSite): string {
  return format(error, [frame]).split('\n    at ')[1];
}

const originalPrepareStackTrace = Error.prepareStackTrace;

beforeEach(() => {
  jest.mocked(fs.existsSync).mockReturnValue(true);
  jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(decodedMap));
  installSourceMaps(new Map([[generatedPath, mapPath]]));
});

afterEach(() => {
  uninstallSourceMaps();
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

    expect(frameOf(new Error('x'), frame)).toBe('/repo/build/input.ts:12:5');
  });

  test('stay at the generated position when nothing maps to them', () => {
    const frame = mappedFrame({isToplevel: true, lineNumber: 40});

    expect(frameOf(new Error('x'), frame)).toBe('/repo/build/out.js:40:1');
  });
});

describe('function names', () => {
  // The name at the frame's own mapped position is the identifier being called
  // there, which annotates the frame with the call on that line. Taking the
  // caller's position instead would be spec-correct and much less readable.
  test('come from the frame’s own mapped position', () => {
    const frame = mappedFrame({functionName: 'throws', typeName: 'Object'});

    expect(frameOf(new Error('x'), frame)).toBe(
      'Object.toBeTruthy (/repo/build/input.ts:10:3)',
    );
  });

  test('fall back to V8’s name where the map has none', () => {
    const frame = mappedFrame({
      columnNumber: 21,
      functionName: 'throws',
      typeName: 'Object',
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      'Object.throws (/repo/build/input.ts:12:5)',
    );
  });

  test('are omitted for a toplevel frame with no name anywhere', () => {
    const frame = mappedFrame({columnNumber: 21, isToplevel: true});

    expect(frameOf(new Error('x'), frame)).toBe('/repo/build/input.ts:12:5');
  });

  test('fall back to the type and method name', () => {
    const frame = mappedFrame({
      columnNumber: 21,
      methodName: 'run',
      typeName: 'Runner',
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      'Runner.run (/repo/build/input.ts:12:5)',
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
      'Timeout.requireModule [as _onTimeout] (/repo/build/input.ts:12:5)',
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
      'Console.log (/repo/build/input.ts:12:5)',
    );
  });

  test('a constructor call is prefixed with `new`', () => {
    const frame = mappedFrame({
      columnNumber: 21,
      functionName: 'Thing',
      isConstructor: true,
    });

    expect(frameOf(new Error('x'), frame)).toBe(
      'new Thing (/repo/build/input.ts:12:5)',
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
      'eval at run (/repo/build/input.ts:10:3), <anonymous>',
    );
  });
});

describe('uninstall', () => {
  test('restores the previous formatter', () => {
    const previous = jest.fn();

    uninstallSourceMaps();
    Error.prepareStackTrace = previous;
    installSourceMaps(null);

    expect(Error.prepareStackTrace).not.toBe(previous);

    uninstallSourceMaps();

    expect(Error.prepareStackTrace).toBe(previous);
  });

  test('leaves a formatter installed by someone else alone', () => {
    const other = jest.fn();

    Error.prepareStackTrace = other;
    uninstallSourceMaps();

    expect(Error.prepareStackTrace).toBe(other);
  });
});
