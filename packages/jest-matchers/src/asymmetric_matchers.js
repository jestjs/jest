/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import {
  equals,
  fnNameFor,
  hasProperty,
  isA,
  isUndefined,
} from './jasmine_utils';

class AsymmetricMatcher {
  $$typeof: Symbol;

  constructor() {
    this.$$typeof = Symbol.for('jest.asymmetricMatcher');
  }
}

class Any extends AsymmetricMatcher {
  sample: any;

  constructor(sample: any) {
    super();
    if (typeof sample === 'undefined') {
      throw new TypeError(
        'any() expects to be passed a constructor function. ' +
          'Please pass one or use anything() to match any object.',
      );
    }
    this.sample = sample;
  }

  asymmetricMatch(other: any) {
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

class Anything extends AsymmetricMatcher {
  asymmetricMatch(other: any) {
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

class ArrayContaining extends AsymmetricMatcher {
  sample: Array<any>;

  constructor(sample: Array<any>) {
    super();
    this.sample = sample;
  }

  asymmetricMatch(other: Array<any>) {
    if (!Array.isArray(this.sample)) {
      throw new Error(
        "You must provide an array to ArrayContaining, not '" +
          typeof this.sample +
          "'.",
      );
    }

    return (
      this.sample.length === 0 ||
      (Array.isArray(other) &&
        this.sample.every(item => other.some(another => equals(item, another))))
    );
  }

  toString() {
    return 'ArrayContaining';
  }

  getExpectedType() {
    return 'array';
  }
}

class ObjectContaining extends AsymmetricMatcher {
  sample: Object;

  constructor(sample: Object) {
    super();
    this.sample = sample;
  }

  asymmetricMatch(other: Object) {
    if (typeof this.sample !== 'object') {
      throw new Error(
        "You must provide an object to ObjectContaining, not '" +
          typeof this.sample +
          "'.",
      );
    }

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

  toString() {
    return 'ObjectContaining';
  }

  getExpectedType() {
    return 'object';
  }
}

class StringContaining extends AsymmetricMatcher {
  sample: string;

  constructor(sample: string) {
    super();
    if (!isA('String', sample)) {
      throw new Error('Expected is not a string');
    }
    this.sample = sample;
  }

  asymmetricMatch(other: string) {
    return other.includes(this.sample);
  }

  toString() {
    return 'StringContaining';
  }

  getExpectedType() {
    return 'string';
  }
}

class StringMatching extends AsymmetricMatcher {
  sample: RegExp;

  constructor(sample: string | RegExp) {
    super();
    if (!isA('String', sample) && !isA('RegExp', sample)) {
      throw new Error('Expected is not a String or a RegExp');
    }

    this.sample = new RegExp(sample);
  }

  asymmetricMatch(other: string) {
    return this.sample.test(other);
  }

  toString() {
    return 'StringMatching';
  }

  getExpectedType() {
    return 'string';
  }
}

export const any = (expectedObject: any) => new Any(expectedObject);
export const anything = () => new Anything();
export const arrayContaining = (sample: Array<any>) =>
  new ArrayContaining(sample);
export const objectContaining = (sample: Object) =>
  new ObjectContaining(sample);
export const stringContaining = (expected: string) =>
  new StringContaining(expected);
export const stringMatching = (expected: string | RegExp) =>
  new StringMatching(expected);
