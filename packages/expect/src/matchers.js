/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {MatchersObject} from 'types/Matchers';

import diff from 'jest-diff';
import getType from 'jest-get-type';
import {escapeStrForRegex} from 'jest-regex-util';
import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  SUGGEST_TO_EQUAL,
  SUGGEST_TO_CONTAIN_EQUAL,
  ensureNoExpected,
  ensureNumbers,
  matcherHint,
  printReceived,
  printExpected,
  printWithType,
} from 'jest-matcher-utils';
import {
  getObjectSubset,
  getPath,
  iterableEquality,
  subsetEquality,
  typeEquality,
  isOneline,
} from './utils';
import {equals} from './jasmine_utils';

type ContainIterable =
  | Array<any>
  | Set<any>
  | NodeList<any>
  | DOMTokenList
  | HTMLCollection<any>;

const matchers: MatchersObject = {
  toBe(received: any, expected: any) {
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
          const suggestToEqual =
            getType(received) === getType(expected) &&
            (getType(received) === 'object' || getType(expected) === 'array') &&
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

    // Passing the the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toBe', pass};
  },

  toBeCloseTo(actual: number, expected: number, precision?: number = 2) {
    const secondArgument = arguments.length === 3 ? 'precision' : null;
    ensureNumbers(actual, expected, '.toBeCloseTo');
    const pass = Math.abs(expected - actual) < Math.pow(10, -precision) / 2;
    const message = () =>
      matcherHint('.toBeCloseTo', undefined, undefined, {
        isNot: this.isNot,
        secondArgument,
      }) +
      '\n\n' +
      `Precision: ${printExpected(precision)}-digit\n` +
      `Expected: ${printExpected(expected)}\n` +
      `Received: ${printReceived(actual)}`;

    return {message, pass};
  },

  toBeDefined(actual: any, expected: void) {
    ensureNoExpected(expected, '.toBeDefined');
    const pass = actual !== void 0;
    const message = () =>
      matcherHint('.toBeDefined', 'received', '', {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeFalsy(actual: any, expected: void) {
    ensureNoExpected(expected, '.toBeFalsy');
    const pass = !actual;
    const message = () =>
      matcherHint('.toBeFalsy', 'received', '', {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeGreaterThan(actual: number, expected: number) {
    ensureNumbers(actual, expected, '.toBeGreaterThan');
    const pass = actual > expected;
    const message = () =>
      matcherHint('.toBeGreaterThan', undefined, undefined, {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Expected: ${printExpected(expected)}\n` +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeGreaterThanOrEqual(actual: number, expected: number) {
    ensureNumbers(actual, expected, '.toBeGreaterThanOrEqual');
    const pass = actual >= expected;
    const message = () =>
      matcherHint('.toBeGreaterThanOrEqual', undefined, undefined, {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Expected: ${printExpected(expected)}\n` +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeInstanceOf(received: any, constructor: Function) {
    const constType = getType(constructor);

    if (constType !== 'function') {
      throw new Error(
        matcherHint('.toBeInstanceOf', 'value', 'constructor', {
          isNot: this.isNot,
        }) +
          `\n\n` +
          `Expected constructor to be a function. Instead got:\n` +
          `  ${printExpected(constType)}`,
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
            received.constructor && received.constructor.name,
          )}\n` +
          `Received value: ${printReceived(received)}`;

    return {message, pass};
  },

  toBeLessThan(actual: number, expected: number) {
    ensureNumbers(actual, expected, '.toBeLessThan');
    const pass = actual < expected;
    const message = () =>
      matcherHint('.toBeLessThan', undefined, undefined, {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Expected: ${printExpected(expected)}\n` +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeLessThanOrEqual(actual: number, expected: number) {
    ensureNumbers(actual, expected, '.toBeLessThanOrEqual');
    const pass = actual <= expected;
    const message = () =>
      matcherHint('.toBeLessThanOrEqual', undefined, undefined, {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Expected: ${printExpected(expected)}\n` +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeNaN(actual: any, expected: void) {
    ensureNoExpected(expected, '.toBeNaN');
    const pass = Number.isNaN(actual);
    const message = () =>
      matcherHint('.toBeNaN', 'received', '', {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeNull(actual: any, expected: void) {
    ensureNoExpected(expected, '.toBeNull');
    const pass = actual === null;
    const message = () =>
      matcherHint('.toBeNull', 'received', '', {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeTruthy(actual: any, expected: void) {
    ensureNoExpected(expected, '.toBeTruthy');
    const pass = !!actual;
    const message = () =>
      matcherHint('.toBeTruthy', 'received', '', {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Received: ${printReceived(actual)}`;
    return {message, pass};
  },

  toBeUndefined(actual: any, expected: void) {
    ensureNoExpected(expected, '.toBeUndefined');
    const pass = actual === void 0;
    const message = () =>
      matcherHint('.toBeUndefined', 'received', '', {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Received: ${printReceived(actual)}`;

    return {message, pass};
  },

  toContain(collection: ContainIterable | string, value: any) {
    const collectionType = getType(collection);

    let converted = null;
    if (Array.isArray(collection) || typeof collection === 'string') {
      // strings have `indexOf` so we don't need to convert
      // arrays have `indexOf` and we don't want to make a copy
      converted = collection;
    } else {
      try {
        converted = Array.from(collection);
      } catch (e) {
        throw new Error(
          matcherHint('[.not].toContainEqual', 'collection', 'value') +
            '\n\n' +
            `Expected ${RECEIVED_COLOR(
              'collection',
            )} to be an array-like structure.\n` +
            printWithType('Received', collection, printReceived),
        );
      }
    }
    // At this point, we're either a string or an Array,
    // which was converted from an array-like structure.
    const pass = converted.indexOf(value) != -1;
    const message = pass
      ? () =>
          matcherHint('.not.toContain', collectionType, 'value') +
          '\n\n' +
          `Expected ${collectionType}:\n` +
          `  ${printReceived(collection)}\n` +
          `Not to contain value:\n` +
          `  ${printExpected(value)}\n`
      : () => {
          const suggestToContainEqual =
            converted !== null &&
            typeof converted !== 'string' &&
            converted instanceof Array &&
            converted.findIndex(item =>
              equals(item, value, [iterableEquality]),
            ) !== -1;
          return (
            matcherHint('.toContain', collectionType, 'value') +
            '\n\n' +
            `Expected ${collectionType}:\n` +
            `  ${printReceived(collection)}\n` +
            `To contain value:\n` +
            `  ${printExpected(value)}` +
            (suggestToContainEqual ? ` ${SUGGEST_TO_CONTAIN_EQUAL}` : '')
          );
        };

    return {message, pass};
  },

  toContainEqual(collection: ContainIterable, value: any) {
    const collectionType = getType(collection);
    let converted = null;
    if (Array.isArray(collection)) {
      converted = collection;
    } else {
      try {
        converted = Array.from(collection);
      } catch (e) {
        throw new Error(
          matcherHint('[.not].toContainEqual', 'collection', 'value') +
            '\n\n' +
            `Expected ${RECEIVED_COLOR(
              'collection',
            )} to be an array-like structure.\n` +
            printWithType('Received', collection, printReceived),
        );
      }
    }

    const pass =
      converted.findIndex(item => equals(item, value, [iterableEquality])) !==
      -1;
    const message = pass
      ? () =>
          matcherHint('.not.toContainEqual', collectionType, 'value') +
          '\n\n' +
          `Expected ${collectionType}:\n` +
          `  ${printReceived(collection)}\n` +
          `Not to contain a value equal to:\n` +
          `  ${printExpected(value)}\n`
      : () =>
          matcherHint('.toContainEqual', collectionType, 'value') +
          '\n\n' +
          `Expected ${collectionType}:\n` +
          `  ${printReceived(collection)}\n` +
          `To contain a value equal to:\n` +
          `  ${printExpected(value)}`;

    return {message, pass};
  },

  toEqual(received: any, expected: any) {
    const pass = equals(received, expected, [iterableEquality]);

    const message = pass
      ? () =>
          matcherHint('.not.toEqual') +
          '\n\n' +
          `Expected value to not equal:\n` +
          `  ${printExpected(expected)}\n` +
          `Received:\n` +
          `  ${printReceived(received)}`
      : () => {
          const oneline = isOneline(expected, received);
          const diffString = diff(expected, received, {expand: this.expand});

          return (
            matcherHint('.toEqual') +
            '\n\n' +
            `Expected value to equal:\n` +
            `  ${printExpected(expected)}\n` +
            `Received:\n` +
            `  ${printReceived(received)}` +
            (diffString && !oneline ? `\n\nDifference:\n\n${diffString}` : '')
          );
        };

    // Passing the the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toEqual', pass};
  },

  toHaveLength(received: any, length: number) {
    if (
      typeof received !== 'string' &&
      (!received || typeof received.length !== 'number')
    ) {
      throw new Error(
        matcherHint('[.not].toHaveLength', 'received', 'length') +
          '\n\n' +
          `Expected value to have a 'length' property that is a number. ` +
          `Received:\n` +
          `  ${printReceived(received)}\n` +
          (received
            ? `received.length:\n  ${printReceived(received.length)}`
            : ''),
      );
    }

    const pass = received.length === length;
    const message = pass
      ? () =>
          matcherHint('.not.toHaveLength', 'received', 'length') +
          '\n\n' +
          `Expected value to not have length:\n` +
          `  ${printExpected(length)}\n` +
          `Received:\n` +
          `  ${printReceived(received)}\n` +
          `received.length:\n` +
          `  ${printReceived(received.length)}`
      : () =>
          matcherHint('.toHaveLength', 'received', 'length') +
          '\n\n' +
          `Expected value to have length:\n` +
          `  ${printExpected(length)}\n` +
          `Received:\n` +
          `  ${printReceived(received)}\n` +
          `received.length:\n` +
          `  ${printReceived(received.length)}`;

    return {message, pass};
  },

  toHaveProperty(object: Object, keyPath: string | Array<any>, value?: any) {
    const valuePassed = arguments.length === 3;
    const secondArgument = valuePassed ? 'value' : null;

    if (!object && typeof object !== 'string' && typeof object !== 'number') {
      throw new Error(
        matcherHint('[.not].toHaveProperty', 'object', 'path', {
          secondArgument,
        }) +
          '\n\n' +
          `Expected ${RECEIVED_COLOR('object')} to be an object. Received:\n` +
          `  ${getType(object)}: ${printReceived(object)}`,
      );
    }

    const keyPathType = getType(keyPath);

    if (keyPathType !== 'string' && keyPathType !== 'array') {
      throw new Error(
        matcherHint('[.not].toHaveProperty', 'object', 'path', {
          secondArgument,
        }) +
          '\n\n' +
          `Expected ${EXPECTED_COLOR(
            'path',
          )} to be a string or an array. Received:\n` +
          `  ${getType(keyPath)}: ${printReceived(keyPath)}`,
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
          }) +
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
            }) +
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

  toMatch(received: string, expected: string | RegExp) {
    if (typeof received !== 'string') {
      throw new Error(
        matcherHint('[.not].toMatch', 'string', 'expected') +
          '\n\n' +
          `${RECEIVED_COLOR('string')} value must be a string.\n` +
          printWithType('Received', received, printReceived),
      );
    }

    if (
      !(expected && typeof expected.test === 'function') &&
      !(typeof expected === 'string')
    ) {
      throw new Error(
        matcherHint('[.not].toMatch', 'string', 'expected') +
          '\n\n' +
          `${EXPECTED_COLOR(
            'expected',
          )} value must be a string or a regular expression.\n` +
          printWithType('Expected', expected, printExpected),
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

  toMatchObject(receivedObject: Object, expectedObject: Object) {
    if (typeof receivedObject !== 'object' || receivedObject === null) {
      throw new Error(
        matcherHint('[.not].toMatchObject', 'object', 'expected') +
          '\n\n' +
          `${RECEIVED_COLOR('received')} value must be an object.\n` +
          printWithType('Received', receivedObject, printReceived),
      );
    }

    if (typeof expectedObject !== 'object' || expectedObject === null) {
      throw new Error(
        matcherHint('[.not].toMatchObject', 'object', 'expected') +
          '\n\n' +
          `${EXPECTED_COLOR('expected')} value must be an object.\n` +
          printWithType('Expected', expectedObject, printExpected),
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

  toStrictEqual(received: any, expected: any) {
    const pass = equals(
      received,
      expected,
      [iterableEquality, typeEquality],
      true,
    );

    const message = pass
      ? () =>
          matcherHint('.not.toStrictEqual') +
          '\n\n' +
          `Expected value to not equal:\n` +
          `  ${printExpected(expected)}\n` +
          `Received:\n` +
          `  ${printReceived(received)}`
      : () => {
          const diffString = diff(expected, received, {
            expand: this.expand,
          });
          return (
            matcherHint('.toStrictEqual') +
            '\n\n' +
            `Expected value to equal:\n` +
            `  ${printExpected(expected)}\n` +
            `Received:\n` +
            `  ${printReceived(received)}` +
            (diffString ? `\n\nDifference:\n\n${diffString}` : '')
          );
        };

    // Passing the the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toStrictEqual', pass};
  },
};

export default matchers;
