/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const prettyFormat = require('pretty-format');
const {
  contains,
  equals,
  fnNameFor,
  hasProperty,
  isA,
  isUndefined,
} = require('./jasmine-utils');

class Any {
  expectedObject: any;

  constructor(expectedObject: any) {
    if (typeof expectedObject === 'undefined') {
      throw new TypeError(
         'jasmine.any() expects to be passed a constructor function. ' +
         'Please pass one or use jasmine.anything() to match any object.'
       );
    }
    this.expectedObject = expectedObject;
  }

  asymmetricMatch(other: any) {
    if (this.expectedObject == String) {
      return typeof other == 'string' || other instanceof String;
    }

    if (this.expectedObject == Number) {
      return typeof other == 'number' || other instanceof Number;
    }

    if (this.expectedObject == Function) {
      return typeof other == 'function' || other instanceof Function;
    }

    if (this.expectedObject == Object) {
      return typeof other == 'object';
    }

    if (this.expectedObject == Boolean) {
      return typeof other == 'boolean';
    }

    return other instanceof this.expectedObject;
  }

  jasmineToString() {
    return '<jasmine.any(' + fnNameFor(this.expectedObject) + ')>';
  }
}

class Anything {
  asymmetricMatch(other: any) {
    return !isUndefined(other) && other !== null;
  }

  jasmineToString() {
    return '<jasmine.anything>';
  }
}

class ArrayContaining {
  sample: Array<any>;

  constructor(sample: Array<any>) {
    this.sample = sample;
  }

  asymmetricMatch(other: Array<any>) {
    const className = Object.prototype.toString.call(this.sample);
    if (className !== '[object Array]') {
      throw new Error(
        'You must provide an array to arrayContaining, not \'' +
        typeof this.sample + '\'.'
       );
    }

    for (let i = 0; i < this.sample.length; i++) {
      const item = this.sample[i];
      if (!contains(other, item)) {
        return false;
      }
    }

    return true;
  }

  toString() {
    return 'ArrayContaining';
  }

  jasmineToString() {
    return '<arrayContaining(' + prettyFormat(this.sample, {min: true}) + ')>';
  }

  jasmineToPrettyString(options: Object) {
    return '<arrayContaining(' + prettyFormat(this.sample, options) + ')>';
  }
 }

class ObjectContaining {
  sample: Object;

  constructor(sample: Object) {
    this.sample = sample;
  }

  asymmetricMatch(other: Object) {
    if (typeof this.sample !== 'object') {
      throw new Error(
        'You must provide an object to objectContaining, not \'' +
        typeof this.sample + '\'.'
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

  jasmineToString() {
    return '<objectContaining(' + prettyFormat(this.sample, {min: true}) + ')>';
  }

  jasmineToPrettyString(options: Object) {
    return '<objectContaining(' + prettyFormat(this.sample, options) + ')>';
  }
}

class StringMatching {
  regexp: RegExp;

  constructor(expected: string | RegExp) {
    if (!isA('String', expected) && !isA('RegExp', expected)) {
      throw new Error('Expected is not a String or a RegExp');
    }

    this.regexp = new RegExp(expected);
  }

  asymmetricMatch(other: string) {
    return this.regexp.test(other);
  }

  jasmineToString() {
    return '<stringMatching(' + prettyFormat(this.regexp, {min: true}) + ')>';
  }
}

module.exports = {
  any: (expectedObject: any) => new Any(expectedObject),
  anything: () => new Anything(),
  arrayContaining: (sample: Array<any>) => new ArrayContaining(sample),
  objectContaining: (sample: Object) => new ObjectContaining(sample),
  stringMatching: (expected: string | RegExp) => new StringMatching(expected),
};
