/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EXPECTED_COLOR, INVERTED_COLOR, printDiffOrStringify} from '../index';

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

  test('received is multiline longer than max', () => {
    const expected = 'multi\nline';
    const received = 'multi' + '\n123456789'.repeat(2000); // 5 + 20K chars

    const test = testDiffOrStringify(expected, received);

    // It is a generic line diff:
    expect(test).toContain(EXPECTED_COLOR('- line'));

    // It is not a specific substring diff
    expect(test).not.toContain(EXPECTED_COLOR('- ' + INVERTED_COLOR('line')));
  });
});
