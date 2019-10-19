/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import {INVERTED_COLOR, printDiffOrStringify} from '../index';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

describe('printDiffOrStringify', () => {
  const testDiffOrStringify = (expected: string, received: string): string =>
    printDiffOrStringify(expected, received, 'Expected', 'Received', true);

  test('expected is empty and received is single line', () => {
    const expected = '';
    const received = 'single line';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('expected is multi line and received is empty', () => {
    const expected = 'multi\nline';
    const received = '';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('expected and received are single line with multiple changes', () => {
    const expected = 'delete common expected common prev';
    const received = 'insert common received common next';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('expected and received are multi line with trailing spaces', () => {
    const expected = 'delete \ncommon expected common\nprev ';
    const received = 'insert \ncommon received common\nnext ';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('has no common after clean up chaff multiline', () => {
    const expected = 'delete\ntwo';
    const received = 'insert\n2';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  test('has no common after clean up chaff one-line', () => {
    const expected = 'delete';
    const received = 'insert';
    expect(testDiffOrStringify(expected, received)).toMatchSnapshot();
  });

  describe('MAX_DIFF_STRING_LENGTH', () => {
    const lessChange = INVERTED_COLOR('single ');
    const less = 'single line';
    const more = 'multi line' + '\n123456789'.repeat(2000); // 10 + 20K chars

    test('both are less', () => {
      const difference = testDiffOrStringify('multi\nline', less);

      expect(difference).toMatch('- multi');
      expect(difference).toMatch('- line');

      // diffStringsUnified has substring change
      expect(difference).not.toMatch('+ single line');
      expect(difference).toMatch(lessChange);
    });

    test('expected is more', () => {
      const difference = testDiffOrStringify(more, less);

      expect(difference).toMatch('- multi line');
      expect(difference).toMatch('+ single line');

      // diffLinesUnified does not have substring change
      expect(difference).not.toMatch(lessChange);
    });

    test('received is more', () => {
      const difference = testDiffOrStringify(less, more);

      expect(difference).toMatch('- single line');
      expect(difference).toMatch('+ multi line');

      // diffLinesUnified does not have substring change
      expect(difference).not.toMatch(lessChange);
    });
  });
});
