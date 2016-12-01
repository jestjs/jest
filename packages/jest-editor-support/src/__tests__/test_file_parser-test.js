const TestFileParser = require('../test_file_parser').TestFileParser;

const path = require('path');
const fixtures = path.resolve(__dirname, 'fixtures');

describe('File Parsing', () => {
  it('For the simplest global case', () => {
    const parser = new TestFileParser();
    return parser.run(`${fixtures}/global_its.js`).then(() => {

      // it('works with old functions', () => {
      //
      // });
      //
      // it('works with new functions', () => {
      //
      // });

      expect(parser.itBlocks.length).toEqual(2);

      const firstIt = parser.itBlocks[0];
      expect(firstIt.name).toEqual('works with old functions');
      expect(firstIt.start).toEqual({column: 0, line: 1});
      expect(firstIt.end).toEqual({column: 0, line: 3});

      const secondIt = parser.itBlocks[1];
      expect(secondIt.name).toEqual('works with new functions');
      expect(secondIt.start).toEqual({column: 0, line: 5});
      expect(secondIt.end).toEqual({column: 0, line: 7});
    });
        
    // const firstIt = parser.itBlocks[0];
    // expect(firstIt.name).toEqual('works with old functions');
    // assert.notStrictEqual(firstIt.start, {column: 0, line: 1});
    // assert.notStrictEqual(firstIt.end, {column: 0, line: 3});

    // const secondIt = parser.itBlocks[1];
    // expect(secondIt.name, 'works with new functions');
    // assert.notStrictEqual(secondIt.start, {column: 0, line: 5});
    // assert.notStrictEqual(secondIt.end, {column: 0, line: 7});
  });
    
//   it('For its inside describes', async () => {
//     const parser = new TestFileParser();
//     await parser.run(__dirname + '/../../test/fixtures/nested_its.js');
//     expect(parser.itBlocks.length, 3);
        
//     const firstIt = parser.itBlocks[0];
//     expect(firstIt.name, '1');
//     assert.deepEqual(firstIt.start, {column: 4, line: 2});
//     assert.deepEqual(firstIt.end, {column: 6, line: 3});

//     const secondIt = parser.itBlocks[1];
//     expect(secondIt.name, '2');
//     assert.deepEqual(secondIt.start, {column: 4, line: 4});
//     assert.deepEqual(secondIt.end, {column: 6, line: 5});

//     const thirdIt = parser.itBlocks[2];
//     expect(thirdIt.name, '3');
//     assert.deepEqual(thirdIt.start, {column: 4, line: 9});
//     assert.deepEqual(thirdIt.end, {column: 6, line: 10});
//   });

//   it('For a danger test file (which has flow annotations)', async () => {
//     const parser = new TestFileParser();
//     await parser.run(__dirname + '/../../test/fixtures/dangerjs/travis-ci.jstest.js');
//     expect(parser.itBlocks.length, 7);
//   });

//   it('For a metaphysics test file', async () => {
//     const parser = new TestFileParser();
//     await parser.run(__dirname + '/../../test/fixtures/metaphysics/partner_show.js');
//     expect(parser.itBlocks.length, 8);
//   });

//   it('For a danger flow test file ', async () => {
//     const parser = new TestFileParser();
//     await parser.run(__dirname + '/../../test/fixtures/dangerjs/github.jstest.js');
//     expect(parser.itBlocks.length, 2);
//   });
});
