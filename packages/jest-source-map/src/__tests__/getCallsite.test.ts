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

describe('getCallsite', () => {
  test('without source map', () => {
    const site = getCallsite(0);

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(expect.any(Number));
    expect(site.getLineNumber()).toEqual(expect.any(Number));
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test('ignores errors when fs throws', () => {
    jest.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('Mock error');
    });

    const site = getCallsite(0, new Map([[__filename, 'mockedSourceMapFile']]));

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(expect.any(Number));
    expect(site.getLineNumber()).toEqual(expect.any(Number));
    expect(fs.readFileSync).toHaveBeenCalledWith('mockedSourceMapFile', 'utf8');
  });

  test('reads source map file to determine line and column', () => {
    jest.mocked(fs.readFileSync).mockImplementation(() =>
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
    }));

    const site = getCallsite(0, new Map([[__filename, 'mockedSourceMapFile']]));

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(sourceMapColumn);
    expect(site.getLineNumber()).toEqual(sourceMapLine);
    expect(originalPositionFor).toHaveBeenCalledTimes(1);
    expect(originalPositionFor).toHaveBeenCalledWith(expect.anything(), {
      column: expect.any(Number),
      line: expect.any(Number),
    });
    expect(fs.readFileSync).toHaveBeenCalledWith('mockedSourceMapFile', 'utf8');
  });
});
