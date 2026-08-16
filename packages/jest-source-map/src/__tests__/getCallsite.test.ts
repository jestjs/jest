/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {originalPositionFor} from '@jridgewell/trace-mapping';
import * as fs from 'graceful-fs';
import getCallsite from '../getCallsite';

jest.mock('graceful-fs');
jest.mock('@jridgewell/trace-mapping', () => {
  const actual = jest.requireActual<typeof import('@jridgewell/trace-mapping')>(
    '@jridgewell/trace-mapping',
  );

  return {
    ...actual,
    originalPositionFor: jest.fn(actual.originalPositionFor),
  };
});

// `readFileSync` is overloaded, so an implementation returning a string does
// not satisfy its type directly.
function mockFileContents(read: (filePath: string) => string) {
  jest
    .mocked(fs.readFileSync)
    .mockImplementation(read as unknown as typeof fs.readFileSync);
}

// Parsed maps are cached for the process lifetime against this path, which is
// content-addressed in real runs, so each test needs its own.
let mapPathCounter = 0;
let mapPath = '';

beforeEach(() => {
  mapPathCounter += 1;
  mapPath = `mockedSourceMapFile-${mapPathCounter}`;
});

describe('getCallsite', () => {
  test('without source map', () => {
    const site = getCallsite(0);

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(expect.any(Number));
    expect(site.getLineNumber()).toEqual(expect.any(Number));
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test('ignores errors when fs throws', () => {
    jest.mocked(fs.existsSync).mockReturnValue(true);
    mockFileContents(() => {
      throw new Error('Mock error');
    });

    const site = getCallsite(0, new Map([[__filename, mapPath]]));

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(expect.any(Number));
    expect(site.getLineNumber()).toEqual(expect.any(Number));
    expect(fs.readFileSync).toHaveBeenCalledWith(mapPath, 'utf8');
  });

  test('reads source map file to determine line and column', () => {
    jest.mocked(fs.existsSync).mockReturnValue(true);
    mockFileContents(() =>
      JSON.stringify({
        file: 'file.js',
        mappings: 'AAAA,OAAO,MAAM,KAAK,GAAG,QAAd',
        names: [],
        sources: ['file.js'],
        sourcesContent: ["export const hello = 'foobar';\\n"],
        version: 3,
      }),
    );

    const sourceMapColumn = 1;
    const sourceMapLine = 2;

    jest.mocked(originalPositionFor).mockImplementation(() => ({
      column: sourceMapColumn,
      line: sourceMapLine,
      name: null,
      source: 'file.js',
    }));

    const site = getCallsite(0, new Map([[__filename, mapPath]]));

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(sourceMapColumn);
    expect(site.getLineNumber()).toEqual(sourceMapLine);
    expect(originalPositionFor).toHaveBeenCalledTimes(1);
    expect(originalPositionFor).toHaveBeenCalledWith(expect.anything(), {
      column: expect.any(Number),
      line: expect.any(Number),
    });
    expect(fs.readFileSync).toHaveBeenCalledWith(mapPath, 'utf8');
  });
});

test('looks up the segment at the zero-based column', () => {
  jest.mocked(fs.existsSync).mockReturnValue(true);
  mockFileContents(() =>
    JSON.stringify({
      file: 'file.js',
      mappings: 'AAAA',
      names: [],
      sources: ['file.js'],
      version: 3,
    }),
  );
  // An unmapped lookup first, so `bare` reports V8's own column. Both calls
  // start at the same column, so the needles are comparable.
  jest.mocked(originalPositionFor).mockReturnValue({
    column: null,
    line: null,
    name: null,
    source: null,
  });

  const bare = getCallsite(0, new Map([[__filename, mapPath]]));
  const rawColumn = bare.getColumnNumber()!;

  jest.mocked(originalPositionFor).mockReturnValue({
    column: 2,
    line: 7,
    name: null,
    source: 'file.js',
  });

  const site = getCallsite(0, new Map([[__filename, mapPath]]));
  const needles = jest.mocked(originalPositionFor).mock.calls;

  // V8 counts columns from one and the needle is zero-based, so the lookup
  // goes in one lower than V8 reported. The result is passed through as-is.
  expect(needles.at(-1)![1].column).toBe(rawColumn - 1);
  expect(site.getColumnNumber()).toBe(2);
  expect(site.getLineNumber()).toBe(7);
});
