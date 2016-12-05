'use strict';

const {parse} = require('../TypeScriptParser');

const path = require('path');
const fixtures = path.resolve(__dirname, 'fixtures');

describe('File Parsing for it blocks', () => {
  
  it('For the simplest it cases', async () => {
    const data = parse(`${fixtures}/global_its.example`);

    expect(data.itBlocks.length).toEqual(3);

    const firstIt = data.itBlocks[0];
    expect(firstIt.name).toEqual('works with old functions');
    expect(firstIt.start).toEqual({column: 0, line: 1});
    expect(firstIt.end).toEqual({column: 2, line: 3});

    const secondIt = data.itBlocks[1];
    expect(secondIt.name).toEqual('works with new functions');
    expect(secondIt.start).toEqual({column: 0, line: 5});
    expect(secondIt.end).toEqual({column: 2, line: 7});
  });
    
  it('For its inside describes', async () => {
    const data = parse(`${fixtures}/nested_its.example`);

    expect(data.itBlocks.length, 4);
        
    const firstIt = data.itBlocks[0];
    expect(firstIt.name).toEqual('1');
    expect(firstIt.start).toEqual({column: 2, line: 1});
    expect(firstIt.end).toEqual({column: 4, line: 2});

    const secondIt = data.itBlocks[1];
    expect(secondIt.name).toEqual('2');
    expect(secondIt.start).toEqual({column: 2, line: 3});
    expect(secondIt.end).toEqual({column: 4, line: 4});

    const thirdIt = data.itBlocks[2];
    expect(thirdIt.name).toEqual('3');
    expect(thirdIt.start).toEqual({column: 2, line: 8});
    expect(thirdIt.end).toEqual({column: 4, line: 9});

    const fourthIt = data.itBlocks[3];
    expect(fourthIt.name).toEqual('4');
    expect(fourthIt.start).toEqual({column: 2, line: 13});
    expect(fourthIt.end).toEqual({column: 4, line: 14});
  });

  // These tests act more like linters that we don't raise on non-trivial files
  // taken from some Artsy codebases, which are MIT licensed.

  it('For a danger test file (which has flow annotations)', async () => {
    const data = parse(`${fixtures}/dangerjs/travis-ci.example`);
    expect(data.itBlocks.length).toEqual(7);
  });

  it('For a danger flow test file ', async () => {
    const data = parse(`${fixtures}/dangerjs/github.example`);
    expect(data.itBlocks.length).toEqual(2);
  });

  it('For a metaphysics test file', async () => {
    const data = parse(`${fixtures}/metaphysics/partner_show.example`);
    expect(data.itBlocks.length).toEqual(8);
  });
});

describe('File Parsing for expects', () => {

  it('finds Expects in a danger test file', async () => {
    const data = parse(`${fixtures}/dangerjs/travis-ci.example`);
    expect(data.expects.length).toEqual(7);
  });

  // These two expect 0s are weird to me

  it('finds Expects in a danger flow test file ', async () => {
    const data = parse(`${fixtures}/dangerjs/github.example`);
    expect(data.expects.length).toEqual(2);
  });

  it('finds Expects in a metaphysics test file', async () => {
    const data = parse(`${fixtures}/metaphysics/partner_show.example`);
    expect(data.expects.length).toEqual(0);
  });
});
