/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest.mock('graceful-fs', () => ({
  ...jest.createMockFromModule<typeof import('fs')>('fs'),
  existsSync: jest.fn().mockReturnValue(true),
}));

import {strict as assert} from 'assert';
import {
  addExtraLineBreaks,
  deepMerge,
  removeExtraLineBreaks,
  removeLinesBeforeExternalMatcherTrap,
  serialize,
} from '../utils';

test('serialize handles \\r\\n', () => {
  const data = '<div>\r\n</div>';
  const serializedData = serialize(data);

  expect(serializedData).toBe('"<div>\n</div>"');
});

describe('ExtraLineBreaks', () => {
  test('0 empty string', () => {
    const expected = '';

    const added = addExtraLineBreaks(expected);
    const removed = removeExtraLineBreaks(added);

    expect(added).toBe(expected);
    expect(removed).toBe(expected);
  });

  test('1 line has double quote marks at edges', () => {
    const expected = '" one line "';

    const added = addExtraLineBreaks(expected);
    const removed = removeExtraLineBreaks(added);

    expect(added).toBe(expected);
    expect(removed).toBe(expected);
  });

  test('1 line has spaces at edges', () => {
    const expected = ' one line ';

    const added = addExtraLineBreaks(expected);
    const removed = removeExtraLineBreaks(added);

    expect(added).toBe(expected);
    expect(removed).toBe(expected);
  });

  test('2 lines both are blank', () => {
    const expected = '\n';

    const added = addExtraLineBreaks(expected);
    const removed = removeExtraLineBreaks(added);

    expect(added).toBe(`\n${expected}\n`);
    expect(removed).toBe(expected);
  });

  test('2 lines have double quote marks at edges', () => {
    const expected = '"\n"';

    const added = addExtraLineBreaks(expected);
    const removed = removeExtraLineBreaks(added);

    expect(added).toBe(`\n${expected}\n`);
    expect(removed).toBe(expected);
  });

  test('2 lines first is blank', () => {
    const expected = '\nsecond line ';

    const added = addExtraLineBreaks(expected);
    const removed = removeExtraLineBreaks(added);

    expect(added).toBe(`\n${expected}\n`);
    expect(removed).toBe(expected);
  });

  test('2 lines last is blank', () => {
    const expected = ' first line\n';

    const added = addExtraLineBreaks(expected);
    const removed = removeExtraLineBreaks(added);

    expect(added).toBe(`\n${expected}\n`);
    expect(removed).toBe(expected);
  });
});

describe('removeLinesBeforeExternalMatcherTrap', () => {
  test('contains external matcher trap', () => {
    const stack = `Error:
    at SnapshotState._addSnapshot (/jest/packages/jest-snapshot/build/State.js:150:9)
    at SnapshotState.match (/jest/packages/jest-snapshot/build/State.js:303:14)
    at _toMatchSnapshot (/jest/packages/jest-snapshot/build/index.js:399:32)
    at _toThrowErrorMatchingSnapshot (/jest/packages/jest-snapshot/build/index.js:585:10)
    at Object.toThrowErrorMatchingInlineSnapshot (/jest/packages/jest-snapshot/build/index.js:504:10)
    at Object.<anonymous> (/jest/packages/expect/build/index.js:138:20)
    at __EXTERNAL_MATCHER_TRAP__ (/jest/packages/expect/build/index.js:378:30)
    at throwingMatcher (/jest/packages/expect/build/index.js:379:15)
    at /jest/packages/expect/build/index.js:285:72
    at Object.<anonymous> (/jest/e2e/to-throw-error-matching-inline-snapshot/__tests__/should-support-rejecting-promises.test.js:3:7)`;

    const expected = `    at throwingMatcher (/jest/packages/expect/build/index.js:379:15)
    at /jest/packages/expect/build/index.js:285:72
    at Object.<anonymous> (/jest/e2e/to-throw-error-matching-inline-snapshot/__tests__/should-support-rejecting-promises.test.js:3:7)`;

    expect(removeLinesBeforeExternalMatcherTrap(stack)).toBe(expected);
  });

  test("doesn't contain external matcher trap", () => {
    const stack = `Error:
    at SnapshotState._addSnapshot (/jest/packages/jest-snapshot/build/State.js:150:9)
    at SnapshotState.match (/jest/packages/jest-snapshot/build/State.js:303:14)
    at _toMatchSnapshot (/jest/packages/jest-snapshot/build/index.js:399:32)
    at _toThrowErrorMatchingSnapshot (/jest/packages/jest-snapshot/build/index.js:585:10)
    at Object.toThrowErrorMatchingInlineSnapshot (/jest/packages/jest-snapshot/build/index.js:504:10)
    at Object.<anonymous> (/jest/packages/expect/build/index.js:138:20)
    at throwingMatcher (/jest/packages/expect/build/index.js:379:15)
    at /jest/packages/expect/build/index.js:285:72
    at Object.<anonymous> (/jest/e2e/to-throw-error-matching-inline-snapshot/__tests__/should-support-rejecting-promises.test.js:3:7)`;

    expect(removeLinesBeforeExternalMatcherTrap(stack)).toBe(stack);
  });
});

describe('DeepMerge with property matchers', () => {
  const matcherString = expect.any(String);
  const matcherNumber = expect.any(Number);
  const matcherObject = expect.any(Object);
  const matcherArray = expect.any(Array);
  const matcherBoolean = expect.any(Boolean);
  const matcherAnything = expect.anything();

  it.each(
    /* eslint-disable sort-keys */
    // to keep keys in numerical order rather than alphabetical
    [
      [
        'a nested object',
        // Target
        {
          data: {
            one: 'one',
            two: 'two',
          },
        },
        // Matchers
        {
          data: {
            two: matcherString,
          },
        },
        // Expected
        {
          data: {
            one: 'one',
            two: matcherString,
          },
        },
      ],

      [
        'an object with an array of objects',
        // Target
        {
          data: {
            one: [
              {
                two: 'two',
                three: 'three',
              },
              // Include an array element not present in the propertyMatchers
              {
                four: 'four',
                five: 'five',
              },
            ],
            six: [{seven: 'seven'}],
            nine: [[{ten: 'ten'}]],
          },
        },
        // Matchers
        {
          data: {
            one: [
              {
                two: matcherString,
              },
            ],
            six: [
              {seven: matcherString},
              // Include an array element not present in the target
              {eight: matcherString},
            ],
            nine: [[{ten: matcherString}]],
          },
        },
        // Expected
        {
          data: {
            one: [
              {
                two: matcherString,
                three: 'three',
              },
              {
                four: 'four',
                five: 'five',
              },
            ],
            six: [{seven: matcherString}, {eight: matcherString}],
            nine: [[{ten: matcherString}]],
          },
        },
      ],

      [
        'an object with an array of strings',
        // Target
        {
          data: {
            one: ['one'],
            two: ['two'],
            three: ['three', 'four'],
            five: ['five'],
          },
        },
        // Matchers
        {
          data: {
            one: [matcherString],
            two: ['two'],
            three: [matcherString],
            five: 'five',
          },
        },
        // Expected
        {
          data: {
            one: [matcherString],
            two: ['two'],
            three: [matcherString, 'four'],
            five: 'five',
          },
        },
      ],

      [
        'an array of objects',
        // Target
        [{name: 'one'}, {name: 'two'}, {name: 'three'}],
        // Matchers
        [{name: 'one'}, {name: matcherString}, {name: matcherString}],
        // Expected
        [{name: 'one'}, {name: matcherString}, {name: matcherString}],
      ],

      [
        'an array of different types',
        // Target
        [
          5,
          'some words',
          [],
          {},
          true,
          false,
          5,
          'some words',
          [],
          {},
          true,
          false,
        ],
        // Matchers
        [
          matcherNumber,
          matcherString,
          matcherArray,
          matcherObject,
          matcherBoolean,
          matcherBoolean,
          matcherAnything,
          matcherAnything,
          matcherAnything,
          matcherAnything,
          matcherAnything,
          matcherAnything,
        ],
        // Expected
        [
          matcherNumber,
          matcherString,
          matcherArray,
          matcherObject,
          matcherBoolean,
          matcherBoolean,
          matcherAnything,
          matcherAnything,
          matcherAnything,
          matcherAnything,
          matcherAnything,
          matcherAnything,
        ],
      ],

      [
        'an array of arrays',
        // Target
        [['one'], ['two'], ['three']],
        // Matchers
        [['one'], [matcherString], [matcherString]],
        // Expected
        [['one'], [matcherString], [matcherString]],
      ],
    ],
    /* eslint-enable sort-keys */
  )('Correctly merges %s', (_case, target, propertyMatchers, expected) => {
    const originalTarget = JSON.parse(JSON.stringify(target));
    const mergedOutput = deepMerge(target, propertyMatchers);

    // Use assert.deepStrictEqual() instead of expect().toStrictEqual()
    // since we want to actually validate that we got the matcher
    // rather than treat it specially the way that expect() does
    assert.deepStrictEqual(mergedOutput, expected);

    // Ensure original target is not modified
    expect(target).toStrictEqual(originalTarget);
  });
});
