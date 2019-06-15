/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ansiRegex from 'ansi-regex';
import style from 'ansi-styles';
import {printDiffOrStringified} from '../print';
import {serialize, unescape} from '../utils';

// This is an experiment to read snapshots more easily:
// * to avoid first line misaligned because of opening double quote mark,
//   return string without calling print function to serialize it,
//   which also reduces extra escape sequences which is a subject of the tests!
// * to align lines, return <d> <g> <r> <y> tags which have same width
// * to see inline markup, return matching <i> and </i> tags
// * to see unexpected escape codes, do not return empty string as default
expect.addSnapshotSerializer({
  serialize(val: string) {
    return val.replace(ansiRegex(), match => {
      switch (match) {
        case style.inverse.open:
          return '<i>';
        case style.inverse.close:
          return '</i>';

        case style.dim.open:
          return '<d>';
        case style.green.open:
          return '<g>';
        case style.red.open:
          return '<r>';
        case style.yellow.open:
          return '<y>';

        case style.dim.close:
        case style.green.close:
        case style.red.close:
        case style.yellow.close:
          return '</>';

        default:
          return match;
      }
    });
  },
  test(val: any) {
    return typeof val === 'string' && !!val.match(ansiRegex());
  },
});

const testDiffOrStringified = (
  expected: any,
  received: any,
  expand: boolean,
): string => {
  // Simulate serializing the expected value as a snapshot,
  // and then returning actual and expected when match function fails.
  // Assume that the caller of printDiffOrStringified trims the strings.
  const expectedSerializedTrimmed = unescape(serialize(expected)).trim();
  const receivedSerializedTrimmed = unescape(serialize(received)).trim();

  return printDiffOrStringified(
    expectedSerializedTrimmed,
    receivedSerializedTrimmed,
    received,
    'Snapshot',
    'Received',
    expand,
  );
};

describe('empty string', () => {
  test('expected and received single line', () => {
    const expected = '';
    const received = 'single line string';

    expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
  });

  test('received and expected multi line', () => {
    const expected = 'multi\nline\nstring';
    const received = '';

    expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
  });
});

describe('escape', () => {
  test('double quote marks in string', () => {
    const expected = 'What does "oobleck" mean?';
    const received = 'What does "ewbleck" mean?';

    expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
  });

  test('backslash in multi line string', () => {
    const expected = 'Forward / slash and back \\ slash';
    const received = 'Forward / slash\nBack \\ slash';

    expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
  });

  test('backslash in single line string', () => {
    const expected = 'forward / slash and back \\ slash';
    const received = 'Forward / slash and back \\ slash';

    expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
  });

  test('regexp', () => {
    const expected = /\\(")/g;
    const received = /\\(")/;

    expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
  });
});

describe('expand', () => {
  const expected = [
    'type TypeName<T> =',
    'T extends string ? "string" :',
    'T extends number ? "number" :',
    'T extends boolean ? "boolean" :',
    'T extends undefined ? "undefined" :',
    'T extends Function ? "function" :',
    '"object";',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    'type TypeName<T> = T extends string',
    '? "string"',
    ': T extends number',
    '? "number"',
    ': T extends boolean',
    '? "boolean"',
    ': T extends undefined',
    '? "undefined"',
    ': T extends Function ? "function" : "object";',
    '',
  ].join('\n');
  const received = [
    'type TypeName<T> =',
    'T extends string ? "string" :',
    'T extends number ? "number" :',
    'T extends boolean ? "boolean" :',
    'T extends undefined ? "undefined" :',
    'T extends Function ? "function" :',
    '"object";',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    'type TypeName<T> = T extends string',
    '? "string"',
    ': T extends number',
    '? "number"',
    ': T extends boolean',
    '? "boolean"',
    ': T extends undefined',
    '? "undefined"',
    ': T extends Function',
    '? "function"',
    ': "object";',
    '',
  ].join('\n');

  test('false', () => {
    expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
  });

  test('true', () => {
    expect(testDiffOrStringified(expected, received, true)).toMatchSnapshot();
  });
});

test('fallback to line diff', () => {
  const expected = [
    '[...a, ...b,];',
    '[...a, ...b];',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '[...a, ...b];',
    '[...a, ...b];',
    '',
  ].join('\n');
  const received = [
    '====================================options=====================================',
    'parsers: ["flow", "typescript"]',
    'printWidth: 80',
    '                                                                                | printWidth',
    '=====================================input======================================',
    '[...a, ...b,];',
    '[...a, ...b];',
    '',
    '=====================================output=====================================',
    '[...a, ...b];',
    '[...a, ...b];',
    '',
    '================================================================================',
  ].join('\n');

  expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
});

describe('isLineDiffable', () => {
  describe('false', () => {
    test('boolean', () => {
      const expected = true;
      const received = false;

      expect(
        testDiffOrStringified(expected, received, false),
      ).toMatchSnapshot();
    });

    test('number', () => {
      const expected = -0;
      const received = NaN;

      expect(
        testDiffOrStringified(expected, received, false),
      ).toMatchSnapshot();
    });
  });

  describe('true', () => {
    test('array', () => {
      const expected0 = {
        code: 4011,
        weight: 2.13,
      };
      const expected1 = {
        code: 4019,
        count: 4,
      };

      const expected = [expected0, expected1];
      const received = [
        {_id: 'b14680dec683e744ada1f2fe08614086', ...expected0},
        {_id: '7fc63ff01769c4fa7d9279e97e307829', ...expected1},
      ];

      expect(
        testDiffOrStringified(expected, received, false),
      ).toMatchSnapshot();
    });

    test('object', () => {
      const type = 'img';
      const expected = {
        props: {
          className: 'logo',
          src: '/img/jest.png',
        },
        type,
      };
      const received = {
        props: {
          alt: 'Jest logo',
          class: 'logo',
          src: '/img/jest.svg',
        },
        type,
      };

      expect(
        testDiffOrStringified(expected, received, false),
      ).toMatchSnapshot();
    });

    test('single line expected and received', () => {
      const expected = [];
      const received = {};

      expect(
        testDiffOrStringified(expected, received, false),
      ).toMatchSnapshot();
    });
  });
});

test('multi line small change in one line and other is unchanged', () => {
  const expected =
    "There is no route defined for key 'Settings'.\nMust be one of: 'Home'";
  const received =
    "There is no route defined for key Settings.\nMust be one of: 'Home'";

  expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
});

test('multi line small changes', () => {
  const expected = [
    '    69 | ',
    "    70 | test('assert.doesNotThrow', () => {",
    '  > 71 |   assert.doesNotThrow(() => {',
    '       |          ^',
    "    72 |     throw Error('err!');",
    '    73 |   });',
    '    74 | });',
    '    at Object.doesNotThrow (__tests__/assertionError.test.js:71:10)',
  ].join('\n');
  const received = [
    '    68 | ',
    "    69 | test('assert.doesNotThrow', () => {",
    '  > 70 |   assert.doesNotThrow(() => {',
    '       |          ^',
    "    71 |     throw Error('err!');",
    '    72 |   });',
    '    73 | });',
    '    at Object.doesNotThrow (__tests__/assertionError.test.js:70:10)',
  ].join('\n');

  expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
});

test('single line large changes', () => {
  const expected = 'Array length must be a finite positive integer';
  const received = 'Invalid array length';

  expect(testDiffOrStringified(expected, received, false)).toMatchSnapshot();
});
