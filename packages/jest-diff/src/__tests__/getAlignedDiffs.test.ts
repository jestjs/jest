/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {diffStringsUnified} from '../printDiffs';

// To align columns so people can review snapshots confidently:

// 1. Use options to omit line colors.
const identity = (string: string) => string;
const changeColor = (string: string) => `<i>${string}</i>`;
const options = {
  aColor: identity,
  bColor: identity,
  changeColor,
  commonColor: identity,
  omitAnnotationLines: true,
  patchColor: identity,
};

const testAlignedDiffs = (a: string, b: string): string =>
  diffStringsUnified(a, b, options);

// 2. Add string serializer to omit double quote marks.
expect.addSnapshotSerializer({
  serialize: (val: string) => val,
  test: (val: unknown) => typeof val === 'string',
});

describe('getAlignedDiffs', () => {
  describe('lines', () => {
    test('change preceding and following common', () => {
      const a = 'delete\ncommon between changes\nprev';
      const b = 'insert\ncommon between changes\nnext';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('common preceding and following change', () => {
      const a = 'common preceding\ndelete\ncommon following';
      const b = 'common preceding\ninsert\ncommon following';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('common at end when both current change lines are empty', () => {
      const a = 'delete\ncommon at end';
      const b = 'common at end';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('common between delete and insert', () => {
      const a = 'delete\ncommon between changes';
      const b = 'common between changes\ninsert';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('common between insert and delete', () => {
      const a = 'common between changes\ndelete';
      const b = 'insert\ncommon between changes';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });
  });

  describe('newline', () => {
    test('delete only', () => {
      const a = 'preceding\nfollowing';
      const b = 'precedingfollowing';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('insert only', () => {
      const a = 'precedingfollowing';
      const b = 'preceding\nfollowing';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('delete with adjacent change', () => {
      const a = 'preceding\nfollowing';
      const b = 'precededfollowing';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('insert with adjacent changes', () => {
      const a = 'precededfollowing';
      const b = 'preceding\nFollowing';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('change from space', () => {
      const a = 'preceding following';
      const b = 'preceding\nfollowing';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('change to space', () => {
      const a = 'preceding\nfollowing';
      const b = 'preceding following';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });
  });

  describe('substrings first', () => {
    test('common when both current change lines are empty', () => {
      const a = 'first\nmiddle\nlast prev';
      const b = 'insert\nfirst\nmiddle\nlast next';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('common when either current change line is non-empty', () => {
      const a = 'expected first\n\nlast';
      const b = 'first\n\nlast';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('delete completes the current line', () => {
      const a = 'common preceding first\nmiddle\nlast and following';
      const b = 'common preceding and following';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('insert completes the current line', () => {
      const a = 'common preceding';
      const b = 'common preceding first\nmiddle\n';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });
  });

  describe('substrings middle', () => {
    test('is empty in delete between common', () => {
      const a = 'common at start precedes delete\n\nexpected common at end';
      const b = 'common at start precedes received common at end';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('is empty in insert at start', () => {
      const a = 'expected common at end';
      const b = 'insert line\n\nreceived common at end';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('is non-empty in delete at end', () => {
      const a = 'common at start precedes delete\nnon-empty line\nnext';
      const b = 'common at start precedes prev';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('is non-empty in insert between common', () => {
      const a = 'common at start precedes delete expected';
      const b = 'common at start precedes insert\nnon-empty\nreceived';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });
  });

  describe('substrings last', () => {
    test('is empty in delete at end', () => {
      const a = 'common string preceding prev\n';
      const b = 'common string preceding next';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('is empty in insert at end', () => {
      const a = 'common string preceding prev';
      const b = 'common string preceding next\n';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('is non-empty in common not at end', () => {
      const a = 'common first\nlast expected';
      const b = 'common first\nlast received';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });
  });

  describe('strings', () => {
    test('change at start and delete or insert at end', () => {
      const a = 'prev change common delete\nunchanged\nexpected change common';
      const b = 'next change common\nunchanged\nreceived change common insert';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });

    test('delete or insert at start and change at end', () => {
      const a = 'common change prev\nunchanged\ndelete common change this';
      const b = 'insert common change next\nunchanged\ncommon change that';
      expect(testAlignedDiffs(a, b)).toMatchSnapshot();
    });
  });
});
