/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {equals, fnNameFor, hasProperty, isA, isUndefined} from './jasmineUtils';

import {emptyObject} from './utils';

export class AsymmetricMatcher<T> {
  protected sample: T;
  $$typeof: symbol;
  inverse?: boolean;

  constructor(sample: T) {
    this.$$typeof = Symbol.for('jest.asymmetricMatcher');
    this.sample = sample;
  }
}

class Any extends AsymmetricMatcher<any> {
  constructor(sample: unknown) {
    if (typeof sample === 'undefined') {
      throw new TypeError(
        'any() expects to be passed a constructor function. ' +
          'Please pass one or use anything() to match any object.',
      );
    }
    super(sample);
  }

  asymmetricMatch(other: unknown) {
    if (this.sample == String) {
      return typeof other == 'string' || other instanceof String;
    }

    if (this.sample == Number) {
      return typeof other == 'number' || other instanceof Number;
    }

    if (this.sample == Function) {
      return typeof other == 'function' || other instanceof Function;
    }

    if (this.sample == Object) {
      return typeof other == 'object';
    }

    if (this.sample == Boolean) {
      return typeof other == 'boolean';
    }

    /* global BigInt */
    if (this.sample == BigInt) {
      return typeof other == 'bigint';
    }

    if (this.sample == Symbol) {
      return typeof other == 'symbol';
    }

    return other instanceof this.sample;
  }

  toString() {
    return 'Any';
  }

  getExpectedType() {
    if (this.sample == String) {
      return 'string';
    }

    if (this.sample == Number) {
      return 'number';
    }

    if (this.sample == Function) {
      return 'function';
    }

    if (this.sample == Object) {
      return 'object';
    }

    if (this.sample == Boolean) {
      return 'boolean';
    }

    return fnNameFor(this.sample);
  }

  toAsymmetricMatcher() {
    return 'Any<' + fnNameFor(this.sample) + '>';
  }
}

class Anything extends AsymmetricMatcher<void> {
  asymmetricMatch(other: unknown) {
    return !isUndefined(other) && other !== null;
  }

  toString() {
    return 'Anything';
  }

  // No getExpectedType method, because it matches either null or undefined.

  toAsymmetricMatcher() {
    return 'Anything';
  }
}

class ArrayContaining extends AsymmetricMatcher<Array<unknown>> {
  constructor(sample: Array<unknown>, inverse: boolean = false) {
    super(sample);
    this.inverse = inverse;
  }

  asymmetricMatch(other: Array<unknown>) {
    if (!Array.isArray(this.sample)) {
      throw new Error(
        `You must provide an array to ${this.toString()}, not '` +
          typeof this.sample +
          "'.",
      );
    }

    const result =
      this.sample.length === 0 ||
      (Array.isArray(other) &&
        this.sample.every(item =>
          other.some(another => equals(item, another)),
        ));

    return this.inverse ? !result : result;
  }

  toString() {
    return `Array${this.inverse ? 'Not' : ''}Containing`;
  }

  getExpectedType() {
    return 'array';
  }
}

class ObjectContaining extends AsymmetricMatcher<Record<string, any>> {
  constructor(sample: Record<string, any>, inverse: boolean = false) {
    super(sample);
    this.inverse = inverse;
  }

  asymmetricMatch(other: any) {
    if (typeof this.sample !== 'object') {
      throw new Error(
        `You must provide an object to ${this.toString()}, not '` +
          typeof this.sample +
          "'.",
      );
    }

    if (this.inverse) {
      for (const property in this.sample) {
        if (
          hasProperty(other, property) &&
          equals(this.sample[property], other[property]) &&
          !emptyObject(this.sample[property]) &&
          !emptyObject(other[property])
        ) {
          return false;
        }
      }

      return true;
    } else {
      for (const property in this.sample) {
        if (
          !hasProperty(other, property) ||
          !equals(this.sample[property], other[property])
        ) {
          return false;
        }
      }

      return true;
    }
  }

  toString() {
    return `Object${this.inverse ? 'Not' : ''}Containing`;
  }

  getExpectedType() {
    return 'object';
  }
}

class StringContaining extends AsymmetricMatcher<string> {
  constructor(sample: string, inverse: boolean = false) {
    if (!isA('String', sample)) {
      throw new Error('Expected is not a string');
    }
    super(sample);
    this.inverse = inverse;
  }

  asymmetricMatch(other: string) {
    const result = isA('String', other) && other.includes(this.sample);

    return this.inverse ? !result : result;
  }

  toString() {
    return `String${this.inverse ? 'Not' : ''}Containing`;
  }

  getExpectedType() {
    return 'string';
  }
}

class StringMatching extends AsymmetricMatcher<RegExp> {
  constructor(sample: string | RegExp, inverse: boolean = false) {
    if (!isA('String', sample) && !isA('RegExp', sample)) {
      throw new Error('Expected is not a String or a RegExp');
    }
    super(new RegExp(sample));

    this.inverse = inverse;
  }

  asymmetricMatch(other: string) {
    const result = isA('String', other) && this.sample.test(other);

    return this.inverse ? !result : result;
  }

  toString() {
    return `String${this.inverse ? 'Not' : ''}Matching`;
  }

  getExpectedType() {
    return 'string';
  }
}

export const any = (expectedObject: unknown): Any => new Any(expectedObject);
export const anything = (): Anything => new Anything();
export const arrayContaining = (sample: Array<unknown>): ArrayContaining =>
  new ArrayContaining(sample);
export const arrayNotContaining = (sample: Array<unknown>): ArrayContaining =>
  new ArrayContaining(sample, true);
export const objectContaining = (
  sample: Record<string, any>,
): ObjectContaining => new ObjectContaining(sample);
export const objectNotContaining = (
  sample: Record<string, any>,
): ObjectContaining => new ObjectContaining(sample, true);
export const stringContaining = (expected: string): StringContaining =>
  new StringContaining(expected);
export const stringNotContaining = (expected: string): StringContaining =>
  new StringContaining(expected, true);
export const stringMatching = (expected: string | RegExp): StringMatching =>
  new StringMatching(expected);
export const stringNotMatching = (expected: string | RegExp): StringMatching =>
  new StringMatching(expected, true);
