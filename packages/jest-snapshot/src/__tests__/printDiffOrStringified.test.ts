/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ansiRegex = require('ansi-regex');
import * as style from 'ansi-styles';
import chalk from 'chalk';
import {printDiffOrStringified} from '../print';
import {stringify} from '../utils';

// This is an experiment to read snapshots more easily:
// * to avoid first line misaligned because of opening double quote mark,
//   return string without calling print function to serialize it,
//   which also reduces extra escape sequences which is a subject of the tests!
// * to align lines, return <d> <g> <r> <y> tags which have same width
// * to see inline markup, return matching <i> and </i> tags
// * to see unexpected escape codes, do not return empty string as default

const convertStyles = (val: string): string =>
  val.replace(ansiRegex(), match => {
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
      case style.bgYellow.open:
        return '<Y>';

      case style.dim.close:
      case style.green.close:
      case style.red.close:
      case style.yellow.close:
      case style.bgYellow.close:
        return '</>';

      default:
        return match;
    }
  });

expect.addSnapshotSerializer({
  serialize(val: string): string {
    return val;
  },
  test(val: any): val is string {
    return typeof val === 'string';
  },
});

// Simulate default serialization.
const testWithStringify = (
  expected: unknown,
  received: unknown,
  expand: boolean,
): string =>
  convertStyles(
    printDiffOrStringified(
      stringify(expected),
      stringify(received),
      received,
      expand,
    ),
  );

// Simulate custom raw string serialization.
const testWithoutStringify = (
  expected: string,
  received: string,
  expand: boolean,
): string =>
  convertStyles(printDiffOrStringified(expected, received, received, expand));

describe('backtick', () => {
  test('single line expected and received', () => {
    const expected = 'var foo = `backtick`;';
    const received = 'var foo = tag`backtick`;';

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });
});

describe('empty string', () => {
  test('expected and received single line', () => {
    const expected = '';
    const received = 'single line string';

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });

  test('received and expected multi line', () => {
    const expected = 'multi\nline\nstring';
    const received = '';

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });
});

describe('escape', () => {
  test('double quote marks in string', () => {
    const expected = 'What does "oobleck" mean?';
    const received = 'What does "ewbleck" mean?';

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });

  test('backslash in multi line string', () => {
    const expected = 'Forward / slash and back \\ slash';
    const received = 'Forward / slash\nBack \\ slash';

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });

  test('backslash in single line string', () => {
    const expected = 'forward / slash and back \\ slash';
    const received = 'Forward / slash and back \\ slash';

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });

  test('regexp', () => {
    const expected = /\\(")/g;
    const received = /\\(")/;

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });
});

describe('expand', () => {
  // prettier/pull/5272
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
    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });

  test('true', () => {
    expect(testWithStringify(expected, received, true)).toMatchSnapshot();
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

  expect(testWithStringify(expected, received, false)).toMatchSnapshot();
});

describe('has no common after clean up chaff', () => {
  test('array', () => {
    const expected = ['delete', 'two'];
    const received = ['insert', '2'];

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });

  test('string single line', () => {
    const expected = 'delete';
    const received = 'insert';

    expect(testWithStringify(expected, received, false)).toMatchSnapshot();
  });
});

describe('MAX_DIFF_STRING_LENGTH', () => {
  const lessChange = chalk.inverse('single ');
  const less = 'single line';
  const more = 'multi line' + '\n123456789'.repeat(2000); // 10 + 20K chars

  test('both are less', () => {
    const difference = printDiffOrStringified('multi\nline', less, less, true);

    expect(difference).toMatch('- multi');
    expect(difference).toMatch('- line');

    // diffStringsUnified has substring change
    expect(difference).not.toMatch('+ single line');
    expect(difference).toMatch(lessChange);
  });

  test('expected is more', () => {
    const difference = printDiffOrStringified(more, less, less, true);

    expect(difference).toMatch('- multi line');
    expect(difference).toMatch('+ single line');

    // diffLinesUnified does not have substring change
    expect(difference).not.toMatch(lessChange);
  });

  test('received is more', () => {
    const difference = printDiffOrStringified(less, more, more, true);

    expect(difference).toMatch('- single line');
    expect(difference).toMatch('+ multi line');

    // diffLinesUnified does not have substring change
    expect(difference).not.toMatch(lessChange);
  });
});

describe('isLineDiffable', () => {
  describe('false', () => {
    test('asymmetric matcher', () => {
      const expected = null;
      const received = {asymmetricMatch: () => {}};

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
    });

    test('boolean', () => {
      const expected = true;
      const received = false;

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
    });

    test('date', () => {
      const expected = new Date('2019-09-19');
      const received = new Date('2019-09-20');

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
    });

    test('error', () => {
      const expected = new Error(
        'Cannot spread fragment "NameAndAppearances" within itself.',
      );
      const received = new Error(
        'Cannot spread fragment "NameAndAppearancesAndFriends" within itself.',
      );

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
    });

    test('function', () => {
      const expected = undefined;
      const received = () => {};

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
    });

    test('number', () => {
      const expected = -0;
      const received = NaN;

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
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

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
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

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
    });

    test('single line expected and received', () => {
      const expected = [];
      const received = {};

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
    });

    test('single line expected and multi line received', () => {
      const expected = [];
      const received = [0];

      expect(testWithStringify(expected, received, false)).toMatchSnapshot();
    });
  });
});

test('multi line small change in one line and other is unchanged', () => {
  const expected =
    "There is no route defined for key 'Settings'.\nMust be one of: 'Home'";
  const received =
    "There is no route defined for key Settings.\nMust be one of: 'Home'";

  expect(testWithStringify(expected, received, false)).toMatchSnapshot();
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

  expect(testWithStringify(expected, received, false)).toMatchSnapshot();
});

test('single line large changes', () => {
  const expected = 'Array length must be a finite positive integer';
  const received = 'Invalid array length';

  expect(testWithStringify(expected, received, false)).toMatchSnapshot();
});

describe('without serialize', () => {
  test('backtick single line expected and received', () => {
    const expected = 'var foo = `backtick`;';
    const received = 'var foo = `back${x}tick`;';

    expect(testWithoutStringify(expected, received, false)).toMatchSnapshot();
  });

  test('backtick single line expected and multi line received', () => {
    const expected = 'var foo = `backtick`;';
    const received = 'var foo = `back\ntick`;';

    expect(testWithoutStringify(expected, received, false)).toMatchSnapshot();
  });

  test('has no common after clean up chaff multi line', () => {
    const expected = 'delete\ntwo';
    const received = 'insert\n2';

    expect(testWithoutStringify(expected, received, false)).toMatchSnapshot();
  });

  test('has no common after clean up chaff single line', () => {
    const expected = 'delete';
    const received = 'insert';

    expect(testWithoutStringify(expected, received, false)).toMatchSnapshot();
  });

  test('prettier/pull/5590', () => {
    const expected = [
      '====================================options=====================================',
      'parsers: ["html"]',
      'printWidth: 80',
      '                                                                                | printWidth',
      '=====================================input======================================',
      `<img src="test.png" alt='John "ShotGun" Nelson'>`,
      '',
      '=====================================output=====================================',
      '<img src="test.png" alt="John &quot;ShotGun&quot; Nelson" />',
      '',
      '================================================================================',
    ].join('\n');
    const received = [
      '====================================options=====================================',
      'parsers: ["html"]',
      'printWidth: 80',
      '                                                                                | printWidth',
      '=====================================input======================================',
      `<img src="test.png" alt='John "ShotGun" Nelson'>`,
      '',
      '=====================================output=====================================',
      `<img src="test.png" alt='John "ShotGun" Nelson' />`,
      '',
      '================================================================================',
    ].join('\n');

    expect(testWithoutStringify(expected, received, false)).toMatchSnapshot();
  });
});
