import fs from 'fs';
import SourceMap from 'source-map';
import getCallsite from '../get_callsite';

// Node 10.5.x compatibility
jest.mock('fs', () =>
  Object.assign({}, jest.genMockFromModule('fs'), {
    ReadStream: require.requireActual('fs').ReadStream,
    WriteStream: require.requireActual('fs').WriteStream,
  }),
);

describe('getCallsite', () => {
  test('without source map', () => {
    const site = getCallsite(0);

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(expect.any(Number));
    expect(site.getLineNumber()).toEqual(expect.any(Number));
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test('ignores errors when fs throws', () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('Mock error');
    });

    const site = getCallsite(0, {[__filename]: 'mockedSourceMapFile'});

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(expect.any(Number));
    expect(site.getLineNumber()).toEqual(expect.any(Number));
    expect(fs.readFileSync).toHaveBeenCalledWith('mockedSourceMapFile', 'utf8');
  });

  test('reads source map file to determine line and column', () => {
    fs.readFileSync.mockImplementation(() => 'file data');

    const sourceMapColumn = 1;
    const sourceMapLine = 2;
    SourceMap.SourceMapConsumer = class {
      originalPositionFor(params) {
        expect(params).toMatchObject({
          column: expect.any(Number),
          line: expect.any(Number),
        });

        return {
          column: sourceMapColumn,
          line: sourceMapLine,
        };
      }
    };

    const site = getCallsite(0, {[__filename]: 'mockedSourceMapFile'});

    expect(site.getFileName()).toEqual(__filename);
    expect(site.getColumnNumber()).toEqual(sourceMapColumn);
    expect(site.getLineNumber()).toEqual(sourceMapLine);
    expect(fs.readFileSync).toHaveBeenCalledWith('mockedSourceMapFile', 'utf8');
  });
});
