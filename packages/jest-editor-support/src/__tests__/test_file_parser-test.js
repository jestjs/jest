const TestFileParser = require('../test_file_parser').TestFileParser;

const path = require('path');
const fixtures = path.resolve(__dirname, 'fixtures');

describe('File Parsing for it blocks', () => {
  it('For the simplest it cases', async () => {
    const parser = new TestFileParser();
    await parser.run(`${fixtures}/global_its.example`);

    expect(parser.itBlocks.length).toEqual(2);

    const firstIt = parser.itBlocks[0];
    expect(firstIt.name).toEqual('works with old functions');
    expect(firstIt.start).toEqual({column: 0, line: 1});
    expect(firstIt.end).toEqual({column: 3, line: 3});

    const secondIt = parser.itBlocks[1];
    expect(secondIt.name).toEqual('works with new functions');
    expect(secondIt.start).toEqual({column: 0, line: 5});
    expect(secondIt.end).toEqual({column: 3, line: 7});
  });
    
  it('For its inside describes', async () => {
    const parser = new TestFileParser();
    await parser.run(`${fixtures}/nested_its.example`);

    expect(parser.itBlocks.length, 3);
        
    const firstIt = parser.itBlocks[0];
    expect(firstIt.name).toEqual('1');
    expect(firstIt.start).toEqual({column: 2, line: 2});
    expect(firstIt.end).toEqual({column: 5, line: 3});

    const secondIt = parser.itBlocks[1];
    expect(secondIt.name).toEqual('2');
    expect(secondIt.start).toEqual({column: 2, line: 4});
    expect(secondIt.end).toEqual({column: 5, line: 5});

    const thirdIt = parser.itBlocks[2];
    expect(thirdIt.name).toEqual('3');
    expect(thirdIt.start).toEqual({column: 2, line: 9});
    expect(thirdIt.end).toEqual({column: 5, line: 10});
  });

  // These tests act more like linters that we don't raise on non-trivial files
  // taken from some Artsy codebases, which are MIT licensed.

  it('For a danger test file (which has flow annotations)', async () => {
    const parser = new TestFileParser();
    await parser.run(`${fixtures}/dangerjs/travis-ci.example`);
    expect(parser.itBlocks.length, 7);
  });

  it('For a danger flow test file ', async () => {
    const parser = new TestFileParser();
    await parser.run(`${fixtures}/dangerjs/github.example`);
    expect(parser.itBlocks.length, 2);
  });

  it('For a metaphysics test file', async () => {
    const parser = new TestFileParser();
    await parser.run(`${fixtures}/metaphysics/partner_show.example`);
    expect(parser.itBlocks.length, 8);
  });
});

describe('File Parsing for expects', () => {
  // TODO
});
