/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
 /* eslint-disable max-len */

'use strict';

const jestExpect = require('../');
const {
  any,
  anything,
  arrayContaining,
  objectContaining,
  stringMatching,
} = require('../asymmetric-matchers');

test('Any.asymmetricMatch()', () => {
  const Thing = function() {};

  [
    any(String).asymmetricMatch('jest'),
    any(Number).asymmetricMatch(1),
    any(Function).asymmetricMatch(() => {}),
    any(Boolean).asymmetricMatch(true),
    any(Object).asymmetricMatch({}),
    any(Array).asymmetricMatch([]),
    any(Thing).asymmetricMatch(new Thing()),
  ].forEach(test => {
    jestExpect(test).toBe(true);
  });
});

test('Any.toAsymmetricMatcher()', () => {
  jestExpect(any(Number).toAsymmetricMatcher()).toBe('Any<Number>');
});

test('Any throws when called with empty constructor', () => {
  jestExpect(() => any()).toThrow();
});

test('Anything matches any type', () => {
  [
    anything().asymmetricMatch('jest'),
    anything().asymmetricMatch(1),
    anything().asymmetricMatch(() => {}),
    anything().asymmetricMatch(true),
    anything().asymmetricMatch({}),
    anything().asymmetricMatch([]),
  ].forEach(test => {
    jestExpect(test).toBe(true);
  });
});

test('Anything does not match null and undefined', () => {
  [
    anything().asymmetricMatch(null),
    anything().asymmetricMatch(undefined),
  ].forEach(test => {
    jestExpect(test).toBe(false);
  });
});

test('Anything.toAsymmetricMatcher()', () => {
  jestExpect(anything().toAsymmetricMatcher()).toBe('Anything');
});

test('ArrayContaining matches', () => {
  [
    arrayContaining([]).asymmetricMatch('jest'),
    arrayContaining(['foo']).asymmetricMatch(['foo']),
    arrayContaining(['foo']).asymmetricMatch(['foo', 'bar']),
    arrayContaining([]).asymmetricMatch({}),
  ].forEach(test => {
    jestExpect(test).toEqual(true);
  });
});

test('ArrayContaining does not match', () => {
  jestExpect(arrayContaining(['foo']).asymmetricMatch(['bar'])).toBe(false);
});

test('ArrayContaining throws for non-arrays', () => {
  jestExpect(() => {
    arrayContaining('foo').asymmetricMatch([]);
  }).toThrow();
});

test('ObjectContaining matches', () => {
  [
    objectContaining({}).asymmetricMatch('jest'),
    objectContaining({foo: 'foo'}).asymmetricMatch({foo: 'foo', jest: 'jest'}),
    objectContaining({foo: undefined}).asymmetricMatch({foo: undefined}),
    objectContaining({first: objectContaining({second: {}})}).asymmetricMatch({first: {second: {}}}),
  ].forEach(test => {
    jestExpect(test).toEqual(true);
  });
});

test('ObjectContaining does not match', () => {
  [
    objectContaining({foo: 'foo'}).asymmetricMatch({bar: 'bar'}),
    objectContaining({foo: 'foo'}).asymmetricMatch({foo: 'foox'}),
    objectContaining({foo: undefined}).asymmetricMatch({}),
  ].forEach(test => {
    jestExpect(test).toEqual(false);
  });
});

test('ObjectContaining matches defined properties', () => {
  const definedPropertyObject = {};
  Object.defineProperty(definedPropertyObject, 'foo', {get: () => 'bar'});
  jestExpect(objectContaining({foo: 'bar'}).asymmetricMatch(definedPropertyObject)).toBe(true);
});

test('ObjectContaining matches prototype properties', () => {
  const prototypeObject = {foo: 'bar'};
  let obj;

  if (Object.create) {
    obj = Object.create(prototypeObject);
  } else {
    function Foo() {}
    Foo.prototype = prototypeObject;
    Foo.prototype.constructor = Foo;
    obj = new Foo();
  }
  jestExpect(objectContaining({foo: 'bar'}).asymmetricMatch(obj)).toBe(true);
});

test('ObjectContaining throws for non-objects', () => {
  jestExpect(() => objectContaining(1337).asymmetricMatch()).toThrow();
});

test('StringMatching matches string against regexp', () => {
  jestExpect(stringMatching(/en/).asymmetricMatch('queen')).toBe(true);
  jestExpect(stringMatching(/en/).asymmetricMatch('queue')).toBe(false);
});

test('StringMatching matches string against string', () => {
  jestExpect(stringMatching('en').asymmetricMatch('queen')).toBe(true);
  jestExpect(stringMatching('en').asymmetricMatch('queue')).toBe(false);
  jestExpect(stringMatching('*this* part').asymmetricMatch('*this* part')).toBe(true);
  jestExpect(stringMatching('*this* part').asymmetricMatch('*that* part')).toBe(false);
});

test('StringMatching throws for non-strings and non-regexps', () => {
  jestExpect(() => {
    stringMatching([1]).asymmetricMatch('queen');
  }).toThrow();
});
