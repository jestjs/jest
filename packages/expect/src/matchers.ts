/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getType, {isPrimitive} from 'jest-get-type';
import {
  DIM_COLOR,
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  SUGGEST_TO_CONTAIN_EQUAL,
  diff,
  ensureExpectedIsNonNegativeInteger,
  ensureNoExpected,
  ensureNumbers,
  getLabelPrinter,
  matcherErrorMessage,
  matcherHint,
  printReceived,
  printExpected,
  printWithType,
  stringify,
  MatcherHintOptions,
} from 'jest-matcher-utils';
import {MatchersObject, MatcherState} from './types';
import {
  printReceivedArrayContainExpectedItem,
  printReceivedStringContainExpectedResult,
  printReceivedStringContainExpectedSubstring,
} from './print';
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

const toStrictEqualTesters = [
  iterableEquality,
  typeEquality,
  sparseArrayEquality,
];

type ContainIterable =
  | Array<unknown>
  | Set<unknown>
  | NodeListOf<any>
  | DOMTokenList
  | HTMLCollectionOf<any>;

const matchers: MatchersObject = {
  toBe(this: MatcherState, received: unknown, expected: unknown) {
    const matcherName = 'toBe';
    const options: MatcherHintOptions = {
      comment: 'Object.is equality',
      isNot: this.isNot,
      promise: this.promise,
    };

    const pass = Object.is(received, expected);

    const message = pass
      ? () =>
          matcherHint(matcherName, undefined, undefined, options) +
          '\n\n' +
          `Expected: not ${printExpected(expected)}`
      : () => {
          const receivedType = getType(received);
          const expectedType = getType(expected);

          const isShallowInequality =
            receivedType !== expectedType ||
            (isPrimitive(expected) &&
              (expectedType !== 'string' || isOneline(expected, received))) ||
            expectedType === 'function' ||
            expectedType === 'regexp' ||
            (received instanceof Error && expected instanceof Error);

          let deepEqualityName = null;
          if (!isShallowInequality) {
            if (expectedType === 'object' || expectedType === 'array') {
              // If deep equality could pass when referential identity fails
              if (equals(received, expected, toStrictEqualTesters, true)) {
                deepEqualityName = 'toStrictEqual';
              } else if (equals(received, expected, [iterableEquality])) {
                deepEqualityName = 'toEqual';
              }
            }
          }

          const hasDifference = stringify(expected) !== stringify(received);
          const difference =
            hasDifference && !isShallowInequality
              ? diff(expected, received, {expand: this.expand}) // string | null
              : null;

          return (
            matcherHint(matcherName, undefined, undefined, options) +
            '\n\n' +
            (deepEqualityName !== null
              ? DIM_COLOR(
                  `If it should pass with deep equality, replace toBe with ${deepEqualityName}`,
                ) + '\n\n'
              : '') +
            (difference !== null
              ? difference
              : `Expected: ${printExpected(expected)}\n` +
                (hasDifference
                  ? `Received: ${printReceived(received)}`
                  : 'Received value has no visual difference'))
          );
        };

    // Passing the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: matcherName, pass};
  },

  toBeCloseTo(
    this: MatcherState,
    received: number,
    expected: number,
    precision: number = 2,
  ) {
    const matcherName = 'toBeCloseTo';
    const secondArgument = arguments.length === 3 ? 'precision' : undefined;
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
      secondArgument,
    };
    ensureNumbers(received, expected, matcherName, options);

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
          matcherHint(matcherName, undefined, undefined, options) +
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
          matcherHint(matcherName, undefined, undefined, options) +
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
    const matcherName = 'toBeDefined';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, matcherName, options);

    const pass = received !== void 0;

    const message = () =>
      matcherHint(matcherName, undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeFalsy(this: MatcherState, received: unknown, expected: void) {
    const matcherName = 'toBeFalsy';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, matcherName, options);

    const pass = !received;

    const message = () =>
      matcherHint(matcherName, undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeGreaterThan(this: MatcherState, received: number, expected: number) {
    const matcherName = 'toBeGreaterThan';
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };
    ensureNumbers(received, expected, matcherName, options);

    const pass = received > expected;

    const message = () =>
      matcherHint(matcherName, undefined, undefined, options) +
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
    const matcherName = 'toBeGreaterThanOrEqual';
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };
    ensureNumbers(received, expected, matcherName, options);

    const pass = received >= expected;

    const message = () =>
      matcherHint(matcherName, undefined, undefined, options) +
      '\n\n' +
      `Expected:${isNot ? ' not' : ''} >= ${printExpected(expected)}\n` +
      `Received:${isNot ? '    ' : ''}    ${printReceived(received)}`;

    return {message, pass};
  },

  toBeInstanceOf(this: MatcherState, received: any, expected: Function) {
    const matcherName = 'toBeInstanceOf';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };

    if (typeof expected !== 'function') {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, undefined, options),
          `${EXPECTED_COLOR('expected')} value must be a function`,
          printWithType('Expected', expected, printExpected),
        ),
      );
    }

    const pass = received instanceof expected;

    const NAME_IS_NOT_STRING = ' name is not a string\n';
    const NAME_IS_EMPTY_STRING = ' name is an empty string\n';

    const message = pass
      ? () =>
          matcherHint(matcherName, undefined, undefined, options) +
          '\n\n' +
          // A truthy test for `expected.name` property has false positive for:
          // function with a defined name property
          // class with a static name method
          (typeof expected.name !== 'string'
            ? 'Expected constructor' + NAME_IS_NOT_STRING
            : expected.name.length === 0
            ? 'Expected constructor' + NAME_IS_EMPTY_STRING
            : `Expected constructor: not ${EXPECTED_COLOR(expected.name)}\n`) +
          `Received value: ${printReceived(received)}`
      : () =>
          matcherHint(matcherName, undefined, undefined, options) +
          '\n\n' +
          // A truthy test for `expected.name` property has false positive for:
          // function with a defined name property
          // class with a static name method
          (typeof expected.name !== 'string'
            ? 'Expected constructor' + NAME_IS_NOT_STRING
            : expected.name.length === 0
            ? 'Expected constructor' + NAME_IS_EMPTY_STRING
            : `Expected constructor: ${EXPECTED_COLOR(expected.name)}\n`) +
          (isPrimitive(received) || Object.getPrototypeOf(received) === null
            ? 'Received value has no prototype\n'
            : typeof received.constructor !== 'function'
            ? ''
            : typeof received.constructor.name !== 'string'
            ? 'Received constructor' + NAME_IS_NOT_STRING
            : received.constructor.name.length === 0
            ? 'Received constructor' + NAME_IS_EMPTY_STRING
            : `Received constructor: ${RECEIVED_COLOR(
                received.constructor.name,
              )}\n`) +
          `Received value: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeLessThan(this: MatcherState, received: number, expected: number) {
    const matcherName = 'toBeLessThan';
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };
    ensureNumbers(received, expected, matcherName, options);

    const pass = received < expected;

    const message = () =>
      matcherHint(matcherName, undefined, undefined, options) +
      '\n\n' +
      `Expected:${isNot ? ' not' : ''} < ${printExpected(expected)}\n` +
      `Received:${isNot ? '    ' : ''}   ${printReceived(received)}`;

    return {message, pass};
  },

  toBeLessThanOrEqual(this: MatcherState, received: number, expected: number) {
    const matcherName = 'toBeLessThanOrEqual';
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };
    ensureNumbers(received, expected, matcherName, options);

    const pass = received <= expected;

    const message = () =>
      matcherHint(matcherName, undefined, undefined, options) +
      '\n\n' +
      `Expected:${isNot ? ' not' : ''} <= ${printExpected(expected)}\n` +
      `Received:${isNot ? '    ' : ''}    ${printReceived(received)}`;

    return {message, pass};
  },

  toBeNaN(this: MatcherState, received: any, expected: void) {
    const matcherName = 'toBeNaN';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, matcherName, options);

    const pass = Number.isNaN(received);

    const message = () =>
      matcherHint(matcherName, undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeNull(this: MatcherState, received: unknown, expected: void) {
    const matcherName = 'toBeNull';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, matcherName, options);

    const pass = received === null;

    const message = () =>
      matcherHint(matcherName, undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeTruthy(this: MatcherState, received: unknown, expected: void) {
    const matcherName = 'toBeTruthy';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, matcherName, options);

    const pass = !!received;

    const message = () =>
      matcherHint(matcherName, undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeUndefined(this: MatcherState, received: unknown, expected: void) {
    const matcherName = 'toBeUndefined';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, matcherName, options);

    const pass = received === void 0;

    const message = () =>
      matcherHint(matcherName, undefined, '', options) +
      '\n\n' +
      `Received: ${printReceived(received)}`;

    return {message, pass};
  },

  toContain(
    this: MatcherState,
    received: ContainIterable | string,
    expected: unknown,
  ) {
    const matcherName = 'toContain';
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      comment: 'indexOf',
      isNot,
      promise: this.promise,
    };

    if (received == null) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, undefined, options),
          `${RECEIVED_COLOR('received')} value must not be null nor undefined`,
          printWithType('Received', received, printReceived),
        ),
      );
    }

    if (typeof received === 'string') {
      const index = received.indexOf(String(expected));
      const pass = index !== -1;

      const message = () => {
        const labelExpected = `Expected ${
          typeof expected === 'string' ? 'substring' : 'value'
        }`;
        const labelReceived = 'Received string';
        const printLabel = getLabelPrinter(labelExpected, labelReceived);

        return (
          matcherHint(matcherName, undefined, undefined, options) +
          '\n\n' +
          `${printLabel(labelExpected)}${isNot ? 'not ' : ''}${printExpected(
            expected,
          )}\n` +
          `${printLabel(labelReceived)}${isNot ? '    ' : ''}${
            isNot
              ? printReceivedStringContainExpectedSubstring(
                  received,
                  index,
                  String(expected).length,
                )
              : printReceived(received)
          }`
        );
      };

      return {message, pass};
    }

    const indexable = Array.from(received);
    const index = indexable.indexOf(expected);
    const pass = index !== -1;

    const message = () => {
      const labelExpected = 'Expected value';
      const labelReceived = `Received ${getType(received)}`;
      const printLabel = getLabelPrinter(labelExpected, labelReceived);

      return (
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `${printLabel(labelExpected)}${isNot ? 'not ' : ''}${printExpected(
          expected,
        )}\n` +
        `${printLabel(labelReceived)}${isNot ? '    ' : ''}${
          isNot && Array.isArray(received)
            ? printReceivedArrayContainExpectedItem(received, index)
            : printReceived(received)
        }` +
        (!isNot &&
        indexable.findIndex(item =>
          equals(item, expected, [iterableEquality]),
        ) !== -1
          ? `\n\n${SUGGEST_TO_CONTAIN_EQUAL}`
          : '')
      );
    };

    return {message, pass};
  },

  toContainEqual(
    this: MatcherState,
    received: ContainIterable,
    expected: unknown,
  ) {
    const matcherName = 'toContainEqual';
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      comment: 'deep equality',
      isNot,
      promise: this.promise,
    };

    if (received == null) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, undefined, options),
          `${RECEIVED_COLOR('received')} value must not be null nor undefined`,
          printWithType('Received', received, printReceived),
        ),
      );
    }

    const index = Array.from(received).findIndex(item =>
      equals(item, expected, [iterableEquality]),
    );
    const pass = index !== -1;

    const message = () => {
      const labelExpected = 'Expected value';
      const labelReceived = `Received ${getType(received)}`;
      const printLabel = getLabelPrinter(labelExpected, labelReceived);

      return (
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `${printLabel(labelExpected)}${isNot ? 'not ' : ''}${printExpected(
          expected,
        )}\n` +
        `${printLabel(labelReceived)}${isNot ? '    ' : ''}${
          isNot && Array.isArray(received)
            ? printReceivedArrayContainExpectedItem(received, index)
            : printReceived(received)
        }`
      );
    };

    return {message, pass};
  },

  toEqual(this: MatcherState, received: unknown, expected: unknown) {
    const matcherName = '.toEqual';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
    };

    const pass = equals(received, expected, [iterableEquality]);

    const message = pass
      ? () =>
          matcherHint(matcherName, undefined, undefined, options) +
          '\n\n' +
          `Expected: ${printExpected(expected)}\n` +
          `Received: ${printReceived(received)}`
      : () => {
          const difference = diff(expected, received, {expand: this.expand});

          return (
            matcherHint(matcherName, undefined, undefined, options) +
            '\n\n' +
            (difference && difference.includes('- Expect')
              ? `Difference:\n\n${difference}`
              : `Expected: ${printExpected(expected)}\n` +
                `Received: ${printReceived(received)}`)
          );
        };

    // Passing the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toEqual', pass};
  },

  toHaveLength(this: MatcherState, received: any, expected: number) {
    const matcherName = 'toHaveLength';
    const isNot = this.isNot;
    const options: MatcherHintOptions = {
      isNot,
      promise: this.promise,
    };

    if (
      typeof received !== 'string' &&
      (!received || typeof received.length !== 'number')
    ) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, undefined, options),
          `${RECEIVED_COLOR(
            'received',
          )} value must have a length property whose value must be a number`,
          printWithType('Received', received, printReceived),
        ),
      );
    }

    ensureExpectedIsNonNegativeInteger(expected, matcherName, options);

    const pass = received.length === expected;

    const message = () => {
      const labelExpected = 'Expected length';
      const labelReceivedLength = 'Received length';
      const labelReceivedValue = `Received ${getType(received)}`;
      const printLabel = getLabelPrinter(
        labelExpected,
        labelReceivedLength,
        labelReceivedValue,
      );

      return (
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `${printLabel(labelExpected)}${isNot ? 'not ' : ''}${printExpected(
          expected,
        )}\n` +
        (isNot
          ? ''
          : `${printLabel(labelReceivedLength)}${printReceived(
              received.length,
            )}\n`) +
        `${printLabel(labelReceivedValue)}${isNot ? '    ' : ''}${printReceived(
          received,
        )}`
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
    const matcherName = '.toHaveProperty';
    const valuePassed = arguments.length === 3;
    const secondArgument = valuePassed ? 'value' : '';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      secondArgument,
    };

    if (object === null || object === undefined) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, 'path', options),
          `${RECEIVED_COLOR('received')} value must not be null nor undefined`,
          printWithType('Received', object, printReceived),
        ),
      );
    }

    const keyPathType = getType(keyPath);

    if (keyPathType !== 'string' && keyPathType !== 'array') {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, 'path', options),
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
          matcherHint(matcherName, 'object', 'path', options) +
          '\n\n' +
          `Expected the object:\n` +
          `  ${printReceived(object)}\n` +
          `Not to have a nested property:\n` +
          `  ${printExpected(keyPath)}\n` +
          (valuePassed ? `With a value of:\n  ${printExpected(value)}\n` : '')
      : () => {
          const difference =
            valuePassed && hasEndProp
              ? diff(value, result.value, {expand: this.expand})
              : '';
          return (
            matcherHint(matcherName, 'object', 'path', options) +
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
                (difference ? `\n\nDifference:\n\n${difference}` : '')
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
    const matcherName = 'toMatch';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };

    if (typeof received !== 'string') {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, undefined, options),
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
          matcherHint(matcherName, undefined, undefined, options),
          `${EXPECTED_COLOR(
            'expected',
          )} value must be a string or regular expression`,
          printWithType('Expected', expected, printExpected),
        ),
      );
    }

    const pass =
      typeof expected === 'string'
        ? received.includes(expected)
        : expected.test(received);

    const message = pass
      ? () =>
          typeof expected === 'string'
            ? matcherHint(matcherName, undefined, undefined, options) +
              '\n\n' +
              `Expected substring: not ${printExpected(expected)}\n` +
              `Received string:        ${printReceivedStringContainExpectedSubstring(
                received,
                received.indexOf(expected),
                expected.length,
              )}`
            : matcherHint(matcherName, undefined, undefined, options) +
              '\n\n' +
              `Expected pattern: not ${printExpected(expected)}\n` +
              `Received string:      ${printReceivedStringContainExpectedResult(
                received,
                typeof expected.exec === 'function'
                  ? expected.exec(received)
                  : null,
              )}`
      : () => {
          const labelExpected = `Expected ${
            typeof expected === 'string' ? 'substring' : 'pattern'
          }`;
          const labelReceived = 'Received string';
          const printLabel = getLabelPrinter(labelExpected, labelReceived);

          return (
            matcherHint(matcherName, undefined, undefined, options) +
            '\n\n' +
            `${printLabel(labelExpected)}${printExpected(expected)}\n` +
            `${printLabel(labelReceived)}${printReceived(received)}`
          );
        };

    return {message, pass};
  },

  toMatchObject(
    this: MatcherState,
    receivedObject: object,
    expectedObject: object,
  ) {
    const matcherName = '.toMatchObject';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
    };

    if (typeof receivedObject !== 'object' || receivedObject === null) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, undefined, options),
          `${RECEIVED_COLOR('received')} value must be a non-null object`,
          printWithType('Received', receivedObject, printReceived),
        ),
      );
    }

    if (typeof expectedObject !== 'object' || expectedObject === null) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, undefined, options),
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
          matcherHint(matcherName, undefined, undefined, options) +
          `\n\nExpected value not to match object:\n` +
          `  ${printExpected(expectedObject)}` +
          `\nReceived:\n` +
          `  ${printReceived(receivedObject)}`
      : () => {
          const difference = diff(
            expectedObject,
            getObjectSubset(receivedObject, expectedObject),
            {
              expand: this.expand,
            },
          );
          return (
            matcherHint(matcherName, undefined, undefined, options) +
            `\n\nExpected value to match object:\n` +
            `  ${printExpected(expectedObject)}` +
            `\nReceived:\n` +
            `  ${printReceived(receivedObject)}` +
            (difference ? `\nDifference:\n${difference}` : '')
          );
        };

    return {message, pass};
  },

  toStrictEqual(this: MatcherState, received: unknown, expected: unknown) {
    const matcherName = '.toStrictEqual';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
    };

    const pass = equals(received, expected, toStrictEqualTesters, true);

    const message = pass
      ? () =>
          matcherHint(matcherName, undefined, undefined, options) +
          '\n\n' +
          `Expected: ${printExpected(expected)}\n` +
          `Received: ${printReceived(received)}`
      : () => {
          const difference = diff(expected, received, {
            expand: this.expand,
          });
          return (
            matcherHint(matcherName, undefined, undefined, options) +
            (difference ? `\n\nDifference:\n\n${difference}` : '')
          );
        };

    // Passing the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toStrictEqual', pass};
  },
};

export default matchers;
