/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getType from 'jest-get-type';
import {escapeStrForRegex} from 'jest-regex-util';
import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  SUGGEST_TO_EQUAL,
  SUGGEST_TO_CONTAIN_EQUAL,
  diff,
  ensureNoExpected,
  ensureNumbers,
  getLabelPrinter,
  matcherErrorMessage,
  matcherHint,
  printReceived,
  printExpected,
  printWithType,
  MatcherHintOptions,
} from 'jest-matcher-utils';
import {MatchersObject, MatcherState} from './types';
import {
  getObjectSubset,
  getPath,
  iterableEquality,
  sparseArrayEquality,
  subsetEquality,
  typeEquality,
  isOneline,
} from './utils';
import {equals} from './jasmineUtils';

type ContainIterable =
  | Array<unknown>
  | Set<unknown>
  | NodeListOf<any>
  | DOMTokenList
  | HTMLCollectionOf<any>;

const matchers: MatchersObject = {
  toBe(this: MatcherState, received: unknown, expected: unknown) {
    const comment = 'Object.is equality';
    const pass = Object.is(received, expected);

    const message = pass
      ? () =>
          matcherHint('.toBe', undefined, undefined, {
            comment,
            isNot: true,
          }) +
          '\n\n' +
          `Expected: ${printExpected(expected)}\n` +
          `Received: ${printReceived(received)}`
      : () => {
          const receivedType = getType(received);
          const expectedType = getType(expected);
          const suggestToEqual =
            receivedType === expectedType &&
            (receivedType === 'object' || expectedType === 'array') &&
            equals(received, expected, [iterableEquality]);
          const oneline = isOneline(expected, received);
          const diffString = diff(expected, received, {expand: this.expand});

          return (
            matcherHint('.toBe', undefined, undefined, {
              comment,
              isNot: false,
            }) +
            '\n\n' +
            `Expected: ${printExpected(expected)}\n` +
            `Received: ${printReceived(received)}` +
            (diffString && !oneline ? `\n\nDifference:\n\n${diffString}` : '') +
            (suggestToEqual ? ` ${SUGGEST_TO_EQUAL}` : '')
          );
        };

    // Passing the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toBe', pass};
  },

  toBeCloseTo(
    this: MatcherState,
    received: number,
    expected: number,
    precision: number = 2,
  ) {
    const secondArgument = arguments.length === 3 ? 'precision' : undefined;
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
      secondArgument,
    };
    ensureNumbers(received, expected, '.toBeCloseTo');

    let pass = false;
    let expectedDiff = 0;
    let receivedDiff = 0;

    if (received === Infinity && expected === Infinity) {
      pass = true; // Infinity - Infinity is NaN
    } else if (received === -Infinity && expected === -Infinity) {
      pass = true; // -Infinity - -Infinity is NaN
    } else {
      expectedDiff = Math.pow(10, -precision) / 2;
      receivedDiff = Math.abs(expected - received);
      pass = receivedDiff < expectedDiff;
    }

    const message = pass
      ? () =>
          matcherHint('toBeCloseTo', undefined, undefined, options) +
          '\n\n' +
          `Expected: not ${printExpected(expected)}\n` +
          (receivedDiff === 0
            ? ''
            : `Received:     ${printReceived(received)}\n` +
              '\n' +
              `Expected precision:        ${printExpected(precision)}\n` +
              `Expected difference: not < ${printExpected(expectedDiff)}\n` +
              `Received difference:       ${printReceived(receivedDiff)}`)
      : () =>
          matcherHint('toBeCloseTo', undefined, undefined, options) +
          '\n\n' +
          `Expected: ${printExpected(expected)}\n` +
          `Received: ${printReceived(received)}\n` +
          '\n' +
          `Expected precision:    ${printExpected(precision)}\n` +
          `Expected difference: < ${printExpected(expectedDiff)}\n` +
          `Received difference:   ${printReceived(receivedDiff)}`;

    return {message, pass};
  },

  toBeDefined(this: MatcherState, received: unknown, expected: void) {
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, 'toBeDefined', options);

    const pass = received !== void 0;

    const message = () =>
      matcherHint('toBeDefined', undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeFalsy(this: MatcherState, received: unknown, expected: void) {
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, 'toBeFalsy', options);

    const pass = !received;

    const message = () =>
      matcherHint('toBeFalsy', undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeGreaterThan(this: MatcherState, received: number, expected: number) {
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };
    ensureNumbers(received, expected, '.toBeGreaterThan');

    const pass = received > expected;

    const message = () =>
      matcherHint('toBeGreaterThan', undefined, undefined, options) +
      '\n\n' +
      `Expected:${isNot ? ' not' : ''} > ${printExpected(expected)}\n` +
      `Received:${isNot ? '    ' : ''}   ${printReceived(received)}`;

    return {message, pass};
  },

  toBeGreaterThanOrEqual(
    this: MatcherState,
    received: number,
    expected: number,
  ) {
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };
    ensureNumbers(received, expected, '.toBeGreaterThanOrEqual');

    const pass = received >= expected;

    const message = () =>
      matcherHint('toBeGreaterThanOrEqual', undefined, undefined, options) +
      '\n\n' +
      `Expected:${isNot ? ' not' : ''} >= ${printExpected(expected)}\n` +
      `Received:${isNot ? '    ' : ''}    ${printReceived(received)}`;

    return {message, pass};
  },

  toBeInstanceOf(this: MatcherState, received: any, constructor: Function) {
    const constType = getType(constructor);

    if (constType !== 'function') {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toBeInstanceOf', undefined, undefined, {
            isNot: this.isNot,
          }),
          `${EXPECTED_COLOR('expected')} value must be a function`,
          printWithType('Expected', constructor, printExpected),
        ),
      );
    }
    const pass = received instanceof constructor;

    const message = pass
      ? () =>
          matcherHint('.toBeInstanceOf', 'value', 'constructor', {
            isNot: this.isNot,
          }) +
          '\n\n' +
          `Expected constructor: ${EXPECTED_COLOR(
            constructor.name || String(constructor),
          )}\n` +
          `Received value: ${printReceived(received)}`
      : () =>
          matcherHint('.toBeInstanceOf', 'value', 'constructor', {
            isNot: this.isNot,
          }) +
          '\n\n' +
          `Expected constructor: ${EXPECTED_COLOR(
            constructor.name || String(constructor),
          )}\n` +
          `Received constructor: ${RECEIVED_COLOR(
            received != null
              ? received.constructor && received.constructor.name
              : '',
          )}\n` +
          `Received value: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeLessThan(this: MatcherState, received: number, expected: number) {
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };
    ensureNumbers(received, expected, '.toBeLessThan');

    const pass = received < expected;

    const message = () =>
      matcherHint('toBeLessThan', undefined, undefined, options) +
      '\n\n' +
      `Expected:${isNot ? ' not' : ''} < ${printExpected(expected)}\n` +
      `Received:${isNot ? '    ' : ''}   ${printReceived(received)}`;

    return {message, pass};
  },

  toBeLessThanOrEqual(this: MatcherState, received: number, expected: number) {
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };
    ensureNumbers(received, expected, '.toBeLessThanOrEqual');

    const pass = received <= expected;

    const message = () =>
      matcherHint('toBeLessThanOrEqual', undefined, undefined, options) +
      '\n\n' +
      `Expected:${isNot ? ' not' : ''} <= ${printExpected(expected)}\n` +
      `Received:${isNot ? '    ' : ''}    ${printReceived(received)}`;

    return {message, pass};
  },

  toBeNaN(this: MatcherState, received: any, expected: void) {
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, 'toBeNaN', options);

    const pass = Number.isNaN(received);

    const message = () =>
      matcherHint('toBeNaN', undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeNull(this: MatcherState, received: unknown, expected: void) {
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, 'toBeNull', options);

    const pass = received === null;

    const message = () =>
      matcherHint('toBeNull', undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeTruthy(this: MatcherState, received: unknown, expected: void) {
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, 'toBeTruthy', options);

    const pass = !!received;

    const message = () =>
      matcherHint('toBeTruthy', undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeUndefined(this: MatcherState, received: unknown, expected: void) {
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, 'toBeUndefined', options);

    const pass = received === void 0;

    const message = () =>
      matcherHint('toBeUndefined', undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toContain(
    this: MatcherState,
    collection: ContainIterable | string,
    value: unknown,
  ) {
    const collectionType = getType(collection);

    let converted: any = null;
    if (Array.isArray(collection) || typeof collection === 'string') {
      // strings have `indexOf` so we don't need to convert
      // arrays have `indexOf` and we don't want to make a copy
      converted = collection;
    } else {
      try {
        converted = Array.from(collection);
      } catch (e) {
        throw new Error(
          matcherErrorMessage(
            matcherHint('.toContain', undefined, undefined, {
              isNot: this.isNot,
            }),
            `${RECEIVED_COLOR(
              'received',
            )} value must not be null nor undefined`,
            printWithType('Received', collection, printReceived),
          ),
        );
      }
    }
    // At this point, we're either a string or an Array,
    // which was converted from an array-like structure.
    const pass = converted.indexOf(value) != -1;
    const message = () => {
      const stringExpected = 'Expected value';
      const stringReceived = `Received ${collectionType}`;
      const printLabel = getLabelPrinter(stringExpected, stringReceived);
      const suggestToContainEqual =
        !pass &&
        converted !== null &&
        typeof converted !== 'string' &&
        converted instanceof Array &&
        converted.findIndex(item => equals(item, value, [iterableEquality])) !==
          -1;

      return (
        matcherHint('.toContain', collectionType, 'value', {
          comment: 'indexOf',
          isNot: this.isNot,
        }) +
        '\n\n' +
        `${printLabel(stringExpected)}${printExpected(value)}\n` +
        `${printLabel(stringReceived)}${printReceived(collection)}` +
        (suggestToContainEqual ? `\n\n${SUGGEST_TO_CONTAIN_EQUAL}` : '')
      );
    };

    return {message, pass};
  },

  toContainEqual(
    this: MatcherState,
    collection: ContainIterable,
    value: unknown,
  ) {
    const collectionType = getType(collection);
    let converted = null;
    if (Array.isArray(collection)) {
      converted = collection;
    } else {
      try {
        converted = Array.from(collection);
      } catch (e) {
        throw new Error(
          matcherErrorMessage(
            matcherHint('.toContainEqual', undefined, undefined, {
              isNot: this.isNot,
            }),
            `${RECEIVED_COLOR(
              'received',
            )} value must not be null nor undefined`,
            printWithType('Received', collection, printReceived),
          ),
        );
      }
    }

    const pass =
      converted.findIndex(item => equals(item, value, [iterableEquality])) !==
      -1;
    const message = () => {
      const stringExpected = 'Expected value';
      const stringReceived = `Received ${collectionType}`;
      const printLabel = getLabelPrinter(stringExpected, stringReceived);

      return (
        matcherHint('.toContainEqual', collectionType, 'value', {
          comment: 'deep equality',
          isNot: this.isNot,
        }) +
        '\n\n' +
        `${printLabel(stringExpected)}${printExpected(value)}\n` +
        `${printLabel(stringReceived)}${printReceived(collection)}`
      );
    };

    return {message, pass};
  },

  toEqual(this: MatcherState, received: unknown, expected: unknown) {
    const pass = equals(received, expected, [iterableEquality]);

    const message = pass
      ? () =>
          matcherHint('.toEqual', undefined, undefined, {
            isNot: this.isNot,
          }) +
          '\n\n' +
          `Expected: ${printExpected(expected)}\n` +
          `Received: ${printReceived(received)}`
      : () => {
          const diffString = diff(expected, received, {expand: this.expand});

          return (
            matcherHint('.toEqual', undefined, undefined, {
              isNot: this.isNot,
            }) +
            '\n\n' +
            (diffString && diffString.includes('- Expect')
              ? `Difference:\n\n${diffString}`
              : `Expected: ${printExpected(expected)}\n` +
                `Received: ${printReceived(received)}`)
          );
        };

    // Passing the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toEqual', pass};
  },

  toHaveLength(this: MatcherState, received: any, length: number) {
    if (
      typeof received !== 'string' &&
      (!received || typeof received.length !== 'number')
    ) {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toHaveLength', undefined, undefined, {
            isNot: this.isNot,
          }),
          `${RECEIVED_COLOR(
            'received',
          )} value must have a length property whose value must be a number`,
          printWithType('Received', received, printReceived),
        ),
      );
    }

    if (typeof length !== 'number') {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toHaveLength', undefined, undefined, {
            isNot: this.isNot,
          }),
          `${EXPECTED_COLOR('expected')} value must be a number`,
          printWithType('Expected', length, printExpected),
        ),
      );
    }

    const pass = received.length === length;
    const message = () => {
      const stringExpected = 'Expected length';
      const stringReceivedLength = 'Received length';
      const stringReceivedValue = `Received ${getType(received)}`;
      const printLabel = getLabelPrinter(
        stringExpected,
        stringReceivedLength,
        stringReceivedValue,
      );

      return (
        matcherHint('.toHaveLength', 'received', 'length', {
          isNot: this.isNot,
        }) +
        '\n\n' +
        `${printLabel(stringExpected)}${printExpected(length)}\n` +
        `${printLabel(stringReceivedLength)}${printReceived(
          received.length,
        )}\n` +
        `${printLabel(stringReceivedValue)}${printReceived(received)}`
      );
    };

    return {message, pass};
  },

  toHaveProperty(
    this: MatcherState,
    object: object,
    keyPath: string | Array<string>,
    value?: unknown,
  ) {
    const valuePassed = arguments.length === 3;
    const secondArgument = valuePassed ? 'value' : null;

    if (object === null || object === undefined) {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toHaveProperty', undefined, 'path', {
            isNot: this.isNot,
            secondArgument,
          } as MatcherHintOptions),
          `${RECEIVED_COLOR('received')} value must not be null nor undefined`,
          printWithType('Received', object, printReceived),
        ),
      );
    }

    const keyPathType = getType(keyPath);

    if (keyPathType !== 'string' && keyPathType !== 'array') {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toHaveProperty', undefined, 'path', {
            isNot: this.isNot,
            secondArgument,
          } as MatcherHintOptions),
          `${EXPECTED_COLOR('expected')} path must be a string or array`,
          printWithType('Expected', keyPath, printExpected),
        ),
      );
    }

    const result = getPath(object, keyPath);
    const {lastTraversedObject, hasEndProp} = result;

    const pass = valuePassed
      ? equals(result.value, value, [iterableEquality])
      : hasEndProp;

    const traversedPath = result.traversedPath.join('.');

    const message = pass
      ? () =>
          matcherHint('.not.toHaveProperty', 'object', 'path', {
            secondArgument,
          } as MatcherHintOptions) +
          '\n\n' +
          `Expected the object:\n` +
          `  ${printReceived(object)}\n` +
          `Not to have a nested property:\n` +
          `  ${printExpected(keyPath)}\n` +
          (valuePassed ? `With a value of:\n  ${printExpected(value)}\n` : '')
      : () => {
          const diffString =
            valuePassed && hasEndProp
              ? diff(value, result.value, {expand: this.expand})
              : '';
          return (
            matcherHint('.toHaveProperty', 'object', 'path', {
              secondArgument,
            } as MatcherHintOptions) +
            '\n\n' +
            `Expected the object:\n` +
            `  ${printReceived(object)}\n` +
            `To have a nested property:\n` +
            `  ${printExpected(keyPath)}\n` +
            (valuePassed
              ? `With a value of:\n  ${printExpected(value)}\n`
              : '') +
            (hasEndProp
              ? `Received:\n` +
                `  ${printReceived(result.value)}` +
                (diffString ? `\n\nDifference:\n\n${diffString}` : '')
              : traversedPath
              ? `Received:\n  ${RECEIVED_COLOR(
                  'object',
                )}.${traversedPath}: ${printReceived(lastTraversedObject)}`
              : '')
          );
        };
    if (pass === undefined) {
      throw new Error('pass must be initialized');
    }

    return {message, pass};
  },

  toMatch(this: MatcherState, received: string, expected: string | RegExp) {
    if (typeof received !== 'string') {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toMatch', undefined, undefined, {
            isNot: this.isNot,
          }),
          `${RECEIVED_COLOR('received')} value must be a string`,
          printWithType('Received', received, printReceived),
        ),
      );
    }

    if (
      !(typeof expected === 'string') &&
      !(expected && typeof expected.test === 'function')
    ) {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toMatch', undefined, undefined, {
            isNot: this.isNot,
          }),
          `${EXPECTED_COLOR(
            'expected',
          )} value must be a string or regular expression`,
          printWithType('Expected', expected, printExpected),
        ),
      );
    }

    const pass = new RegExp(
      typeof expected === 'string' ? escapeStrForRegex(expected) : expected,
    ).test(received);
    const message = pass
      ? () =>
          matcherHint('.not.toMatch') +
          `\n\nExpected value not to match:\n` +
          `  ${printExpected(expected)}` +
          `\nReceived:\n` +
          `  ${printReceived(received)}`
      : () =>
          matcherHint('.toMatch') +
          `\n\nExpected value to match:\n` +
          `  ${printExpected(expected)}` +
          `\nReceived:\n` +
          `  ${printReceived(received)}`;

    return {message, pass};
  },

  toMatchObject(
    this: MatcherState,
    receivedObject: object,
    expectedObject: object,
  ) {
    if (typeof receivedObject !== 'object' || receivedObject === null) {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toMatchObject', undefined, undefined, {
            isNot: this.isNot,
          }),
          `${RECEIVED_COLOR('received')} value must be a non-null object`,
          printWithType('Received', receivedObject, printReceived),
        ),
      );
    }

    if (typeof expectedObject !== 'object' || expectedObject === null) {
      throw new Error(
        matcherErrorMessage(
          matcherHint('.toMatchObject', undefined, undefined, {
            isNot: this.isNot,
          }),
          `${EXPECTED_COLOR('expected')} value must be a non-null object`,
          printWithType('Expected', expectedObject, printExpected),
        ),
      );
    }

    const pass = equals(receivedObject, expectedObject, [
      iterableEquality,
      subsetEquality,
    ]);

    const message = pass
      ? () =>
          matcherHint('.not.toMatchObject') +
          `\n\nExpected value not to match object:\n` +
          `  ${printExpected(expectedObject)}` +
          `\nReceived:\n` +
          `  ${printReceived(receivedObject)}`
      : () => {
          const diffString = diff(
            expectedObject,
            getObjectSubset(receivedObject, expectedObject),
            {
              expand: this.expand,
            },
          );
          return (
            matcherHint('.toMatchObject') +
            `\n\nExpected value to match object:\n` +
            `  ${printExpected(expectedObject)}` +
            `\nReceived:\n` +
            `  ${printReceived(receivedObject)}` +
            (diffString ? `\nDifference:\n${diffString}` : '')
          );
        };

    return {message, pass};
  },

  toStrictEqual(this: MatcherState, received: unknown, expected: unknown) {
    const pass = equals(
      received,
      expected,
      [iterableEquality, typeEquality, sparseArrayEquality],
      true,
    );

    const hint = matcherHint('.toStrictEqual', undefined, undefined, {
      isNot: this.isNot,
    });
    const message = pass
      ? () =>
          hint +
          '\n\n' +
          `Expected: ${printExpected(expected)}\n` +
          `Received: ${printReceived(received)}`
      : () => {
          const diffString = diff(expected, received, {
            expand: this.expand,
          });
          return hint + (diffString ? `\n\nDifference:\n\n${diffString}` : '');
        };

    // Passing the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toStrictEqual', pass};
  },
};

export default matchers;
