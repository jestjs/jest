/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff, diffStringsRaw} from '../';

describe('diffStringsRaw', () => {
  test('one-line with cleanup', () => {
    const expected: Array<Diff> = [
      new Diff(DIFF_EQUAL, 'change '),
      new Diff(DIFF_DELETE, 'from'),
      new Diff(DIFF_INSERT, 'to'),
    ];
    const received = diffStringsRaw('change from', 'change to', true);

    expect(received).toEqual(expected);
  });

  test('one-line without cleanup', () => {
    const expected: Array<Diff> = [
      new Diff(DIFF_EQUAL, 'change '),
      new Diff(DIFF_DELETE, 'fr'),
      new Diff(DIFF_INSERT, 't'),
      new Diff(DIFF_EQUAL, 'o'),
      new Diff(DIFF_DELETE, 'm'),
    ];
    const received = diffStringsRaw('change from', 'change to', false);

    expect(received).toEqual(expected);
  });
});
