/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fixtures = __dirname;

function parserTests(parse: (file: string) => ParserResult) {
  const assertBlock2 = (
    block,
    sl: number,
    sc: number,
    el: number,
    ec: number,
    name: ?string = null,
  ) => assertBlock(block, {column: sc, line: sl}, {column: ec, line: el}, name);
  const assertBlock = (block, start, end, name: ?string = null) => {
    expect(block.start).toEqual(start);
    expect(block.end).toEqual(end);
    if (name) {
      expect(block.name).toEqual(name);
    }
  };
  describe('File parsing without throwing', () => {
    it('Should not throw', () => {
      expect(() => {
        parse(`${fixtures}/declarationWithoutAssignment.example`);
      }).not.toThrow();
    });
  });

  describe('File Parsing for it blocks', () => {
    it('For the simplest it cases', () => {
      const data = parse(`${fixtures}/global_its.example`);

      expect(data.itBlocks.length).toEqual(8);

      const firstIt = data.itBlocks[0];
      expect(firstIt.name).toEqual('works with old functions');
      expect(firstIt.start).toEqual({column: 1, line: 2});
      expect(firstIt.end).toEqual({column: 3, line: 4});

      const secondIt = data.itBlocks[1];
      expect(secondIt.name).toEqual('works with new functions');
      expect(secondIt.start).toEqual({column: 1, line: 6});
      expect(secondIt.end).toEqual({column: 3, line: 8});

      const thirdIt = data.itBlocks[2];
      expect(thirdIt.name).toEqual('works with flow functions');
      expect(thirdIt.start).toEqual({column: 1, line: 10});
      expect(thirdIt.end).toEqual({column: 3, line: 12});

      const fourthIt = data.itBlocks[2];
      expect(fourthIt.name).toEqual('works with flow functions');
      expect(fourthIt.start).toEqual({column: 1, line: 10});
      expect(fourthIt.end).toEqual({column: 3, line: 12});

      const fifthIt = data.itBlocks[4];
      expect(fifthIt.name).toEqual('works with it.only');
      expect(fifthIt.start).toEqual({column: 1, line: 18});
      expect(fifthIt.end).toEqual({column: 3, line: 20});

      const sixthIt = data.itBlocks[5];
      expect(sixthIt.name).toEqual('works with fit');
      expect(sixthIt.start).toEqual({column: 1, line: 22});
      expect(sixthIt.end).toEqual({column: 3, line: 24});

      const seventhIt = data.itBlocks[6];
      expect(seventhIt.name).toEqual('works with test');
      expect(seventhIt.start).toEqual({column: 1, line: 26});
      expect(seventhIt.end).toEqual({column: 3, line: 28});

      const eigthIt = data.itBlocks[7];
      expect(eigthIt.name).toEqual('works with test.only');
      expect(eigthIt.start).toEqual({column: 1, line: 30});
      expect(eigthIt.end).toEqual({column: 3, line: 32});
    });

    it('For its inside describes', () => {
      const data = parse(`${fixtures}/nested_its.example`);

      expect(data.itBlocks.length).toEqual(6);

      const firstIt = data.itBlocks[0];
      expect(firstIt.name).toEqual('1');
      expect(firstIt.start).toEqual({column: 3, line: 2});
      expect(firstIt.end).toEqual({column: 5, line: 3});

      const secondIt = data.itBlocks[1];
      expect(secondIt.name).toEqual('2');
      expect(secondIt.start).toEqual({column: 3, line: 4});
      expect(secondIt.end).toEqual({column: 5, line: 5});

      const thirdIt = data.itBlocks[2];
      expect(thirdIt.name).toEqual('3');
      expect(thirdIt.start).toEqual({column: 3, line: 9});
      expect(thirdIt.end).toEqual({column: 5, line: 10});

      const fourthIt = data.itBlocks[3];
      expect(fourthIt.name).toEqual('4');
      expect(fourthIt.start).toEqual({column: 3, line: 14});
      expect(fourthIt.end).toEqual({column: 5, line: 15});

      const fifthIt = data.itBlocks[4];
      expect(fifthIt.name).toEqual('5');
      expect(fifthIt.start).toEqual({column: 3, line: 19});
      expect(fifthIt.end).toEqual({column: 5, line: 20});

      const sixthIt = data.itBlocks[5];
      expect(sixthIt.name).toEqual('6');
      expect(sixthIt.start).toEqual({column: 3, line: 24});
      expect(sixthIt.end).toEqual({column: 5, line: 25});
    });

    // These tests act more like linters that we don't raise on
    // non-trivial files taken from some Artsy codebases,
    // which are MIT licensed.

    it('For a danger test file (which has flow annotations)', () => {
      const data = parse(`${fixtures}/dangerjs/travis-ci.example`);
      expect(data.itBlocks.length).toEqual(8);
    });

    it('For a danger flow test file ', () => {
      const data = parse(`${fixtures}/dangerjs/github.example`);
      expect(data.itBlocks.length).toEqual(2);
    });

    it('For a metaphysics test file', () => {
      const data = parse(`${fixtures}/metaphysics/partner_show.example`);
      expect(data.itBlocks.length).toEqual(8);
    });

    it('For a call expression without text test file', () => {
      const data = parse(`${fixtures}/callExpressionWithoutText.example`);
      expect(data.itBlocks.length).toEqual(1);
    });
  });

  describe('File Parsing for expects', () => {
    it('finds Expects in a danger test file', () => {
      const data = parse(`${fixtures}/dangerjs/travis-ci.example`);
      expect(data.expects.length).toEqual(8);

      const firstExpect = data.expects[0];
      expect(firstExpect.start).toEqual({column: 5, line: 13});
      expect(firstExpect.end).toEqual({column: 36, line: 13});
    });

    it('finds Expects in a danger flow test file ', () => {
      const data = parse(`${fixtures}/dangerjs/github.example`);
      expect(data.expects.length).toEqual(3);

      const thirdExpect = data.expects[2];
      expect(thirdExpect.start).toEqual({column: 5, line: 33});
      expect(thirdExpect.end).toEqual({column: 39, line: 33});
    });

    it('finds Expects in a metaphysics test file', () => {
      const data = parse(`${fixtures}/metaphysics/partner_show.example`);
      expect(data.expects.length).toEqual(10);
    });

    it('finds Expects in a call expression without text test file', () => {
      const data = parse(`${fixtures}/callExpressionWithoutText.example`);
      expect(data.expects.length).toEqual(1);
    });
  });
  describe('File Parsing for describe blocks', () => {
    it('finds describe in a danger test file', () => {
      const data = parse(`${fixtures}/dangerjs/travis-ci.example`);
      expect(data.describeBlocks.length).toEqual(4);

      const firstDescribe = data.describeBlocks[0];
      assertBlock(
        firstDescribe,
        {column: 1, line: 10},
        {column: 2, line: 20},
        '.isCI',
      );
    });
    it('finds test blocks within describe blocks', () => {
      const data = parse(`${fixtures}/dangerjs/travis-ci.example`);
      const descBlock = data.describeBlocks[1];
      expect(descBlock.children.length).toBe(4);

      // check test blocks, including the template literal
      const found = descBlock.children.filter(
        b =>
          b.name === 'needs to have a PR number' ||
          b.name === 'does not validate without josh' ||
          b.name === 'does not validate when ${key} is missing',
      );
      expect(found.length).toBe(3);
    });
  });
  describe('Nested Elements', () => {
    let nested;
    beforeEach(() => {
      const data = parse(`${fixtures}/nested_elements.example`);
      nested = data.root.children.filter(
        e => e.type === 'describe' && e.name === 'describe 1.0',
      )[0];
    });
    it('can find nested describe or test blocks', () => {
      expect(nested.children.length).toBe(2);
      expect(nested.children[0].type).toBe('it');
      expect(nested.children[0].name).toBe('test 1.1');
      expect(nested.children[1].type).toBe('describe');
      expect(nested.children[1].name).toBe('describe 1.2');
    });
    it('can find deep nested blocks', () => {
      const itBlock = nested.children[0];
      expect(itBlock.children.length).toBe(2);
      expect(itBlock.children[0].name).toBe('test 1.1.1');
      expect(itBlock.children[1].name).toBe('describe 1.1.2');

      const descBlock = itBlock.children[1];
      expect(descBlock.children.length).toBe(1);
      expect(descBlock.children[0].name).toBe('test 1.1.2.1');
      expect(descBlock.children[0].children[0].type).toBe('expect');
    });
  });

  describe('template literals', () => {
    const parseResult = parse(`${fixtures}/template-literal.example`);

    test(`all blocks are parsed`, () => {
      expect(parseResult.describeBlocks.length).toEqual(6);
      expect(parseResult.itBlocks.length).toEqual(7);
      expect(parseResult.expects.length).toEqual(4);
    });
    test(`no expression template`, () => {
      const dBlock = parseResult.describeBlocks.filter(
        b => b.name === 'no expression template',
      )[0];
      const t1 = dBlock.children[0];
      const e1 = t1.children[0];

      expect(dBlock.children.length).toBe(1);
      expect(t1.children.length).toBe(1);

      assertBlock(
        t1,
        {column: 3, line: 2},
        {column: 5, line: 4},
        'test has no expression either',
      );
      assertBlock(e1, {column: 5, line: 3}, {column: 25, line: 3});
    });

    test(`simple template literal`, () => {
      const dBlock = parseResult.describeBlocks.filter(
        b => b.name === 'simple template literal',
      )[0];
      expect(dBlock.children.length).toBe(3);

      const t1 = dBlock.children[0];
      const t2 = dBlock.children[1];
      const t3 = dBlock.children[2];

      assertBlock(
        t1,
        {column: 3, line: 8},
        {column: 46, line: 8},
        '${expression} up front',
      );
      assertBlock(
        t2,
        {column: 3, line: 9},
        {column: 4, line: 10},
        'at the end ${expression}',
      );
      assertBlock(
        t3,
        {column: 3, line: 11},
        {column: 5, line: 12},
        'mixed ${expression1} and ${expression2}',
      );
    });

    test(`template literal with functions`, () => {
      const dBlock = parseResult.describeBlocks.filter(
        b => b.name === 'template literal with functions',
      )[0];
      const t1 = dBlock.children[0];
      const e1 = t1.children[0];

      expect(dBlock.children.length).toBe(1);
      expect(t1.children.length).toBe(1);

      assertBlock(
        t1,
        {column: 3, line: 16},
        {column: 5, line: 18},
        'this ${test} calls ${JSON.stringfy(expression)} should still work',
      );
      assertBlock(e1, {column: 5, line: 17}, {column: 31, line: 17});
    });

    test(`multiline template literal`, () => {
      const dBlock = parseResult.describeBlocks.filter(
        b => b.name === 'multiline template literal',
      )[0];
      const t1 = dBlock.children[0];
      const e1 = t1.children[0];

      expect(dBlock.children.length).toBe(1);
      expect(t1.children.length).toBe(1);

      assertBlock(
        t1,
        {column: 3, line: 22},
        {column: 5, line: 25},
        `this \${test} will span in
    multiple lines`,
      );
      assertBlock(e1, {column: 5, line: 24}, {column: 32, line: 24});
    });

    test(`edge case: should not fail`, () => {
      const dBlock = parseResult.describeBlocks.filter(
        b => b.name === 'edge case: should not fail',
      )[0];
      const t1 = dBlock.children[0];
      const e1 = t1.children[0];

      expect(dBlock.children.length).toBe(2);
      expect(t1.children.length).toBe(1);

      assertBlock(t1, {column: 3, line: 29}, {column: 5, line: 31}, '');
      assertBlock(e1, {column: 5, line: 30}, {column: 30, line: 30});
    });
  });

  const assertNameInfo = (
    nBlock: NamedBlock,
    name: string,
    startLine: number,
    startCol: number,
    endLine: number,
    endCol: number,
  ) => {
    expect(nBlock.name).toEqual(name);
    expect(nBlock.nameRange.start.line).toEqual(startLine);
    expect(nBlock.nameRange.start.column).toEqual(startCol);
    expect(nBlock.nameRange.end.line).toEqual(endLine);
    expect(nBlock.nameRange.end.column).toEqual(endCol);
  };

  describe('name range', () => {
    it('name range for string literals', () => {
      const parseResult = parse(`${fixtures}/nested_elements.example`);
      const dBlock = parseResult.describeBlocks[0];
      assertNameInfo(dBlock, 'describe 1.0', 1, 11, 1, 22);
      const itBlock = parseResult.itBlocks[2];
      assertNameInfo(itBlock, 'test 1.1.2.1', 5, 11, 5, 22);
    });
    it('name range for template literals', () => {
      const parseResult = parse(`${fixtures}/template-literal.example`);
      let itBlock = parseResult.itBlocks[0];
      assertNameInfo(itBlock, 'test has no expression either', 2, 7, 2, 35);
      itBlock = parseResult.itBlocks[1];
      assertNameInfo(itBlock, '${expression} up front', 8, 12, 8, 33);
      itBlock = parseResult.itBlocks[5];
      assertNameInfo(
        itBlock,
        `this \${test} will span in
    multiple lines`,
        22,
        7,
        23,
        18,
      );
    });
  });

  describe('parse string buffer', () => {
    it('can parse non-empty string buffer', () => {
      const data = `
    describe('d1', () => {
      test('t1', () => {
        expect(true).toEqual(true)
      })
    })
    it('t2', () => {
      expect(true).toBeTruthy()
    })
    `;
      const parseResult = parse(`${fixtures}/template-literal.example`, data);
      expect(parseResult.describeBlocks.length).toEqual(1);
      expect(parseResult.itBlocks.length).toEqual(2);
      expect(parseResult.expects.length).toEqual(2);

      const describeBlock = parseResult.describeBlocks[0];
      assertBlock2(describeBlock, 2, 5, 6, 6, 'd1');
      assertNameInfo(describeBlock, 'd1', 2, 15, 2, 16);
      const itBlock = parseResult.itBlocks[0];
      assertBlock2(itBlock, 3, 7, 5, 8, 't1');
      assertNameInfo(itBlock, 't1', 3, 13, 3, 14);
    });
    it('ignore empty/falsy string buffer', () => {
      const parseResult = parse(`${fixtures}/template-literal.example`, '');
      let block = parseResult.itBlocks[parseResult.itBlocks.length - 1];
      expect(block.name).toEqual('');
      expect(block.children.length).toEqual(1);

      block = parseResult.describeBlocks[parseResult.describeBlocks.length - 1];
      expect(block.name).toEqual('empty describe should not crash');
      expect(block.children).toBeFalsy();
    });
  });
}

module.exports = {
  parserTests,
};
