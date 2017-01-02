/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable max-len */

'use strict';

const prettyFormat = require('../');
const AsymmetricMatcher = require('../plugins/AsymmetricMatcher');
const jestExpect = require('jest-matchers');
let options;

function fnNameFor(func) {
  if (func.name) {
    return func.name;
  }

  const matches = func.toString().match(/^\s*function\s*(\w*)\s*\(/);
  return matches ? matches[1] : '<anonymous>';
}

beforeEach(() => {
  options = {plugins: [AsymmetricMatcher]};
});

[
  String,
  Function,
  Array,
  Object,
  RegExp,
  Symbol,
  Function,
  () => {},
  function namedFuntction() {},
].forEach(type => {
  test(`supports any(${fnNameFor(type)})`, () => {
    const result = prettyFormat(jestExpect.any(type), options);
    expect(result).toEqual(`<any(${fnNameFor(type)})>`);
  });

  test(`supports nested any(${fnNameFor(type)})`, () => {
    const result = prettyFormat({
      test: {
        nested: jestExpect.any(type),
      },
    }, options);
    expect(result).toEqual(`Object {\n  "test": Object {\n    "nested": <any(${fnNameFor(type)})>,\n  },\n}`);
  });
});

test(`anything()`, () => {
  const result = prettyFormat(jestExpect.anything(), options);
  expect(result).toEqual('<anything>');
});

test(`arrayContaining()`, () => {
  const result = prettyFormat(jestExpect.arrayContaining([1, 2]), options);
  expect(result).toEqual(
`<arrayContaining(Array [
  1,
  2,
])>`
  );
});

test(`objectContaining()`, () => {
  const result = prettyFormat(jestExpect.objectContaining({a: 'test'}), options);
  expect(result).toEqual(
`<objectContaining(Object {
  "a": "test",
})>`
  );
});

test(`stringMatching(string)`, () => {
  const result = prettyFormat(jestExpect.stringMatching('jest'), options);
  expect(result).toEqual('<stringMatching(/jest/)>');
});

test(`stringMatching(regexp)`, () => {
  const result = prettyFormat(jestExpect.stringMatching(/(jest|niema).*/), options);
  expect(result).toEqual('<stringMatching(/(jest|niema).*/)>');
});

test(`supports multiple nested asymmetric matchers`, () => {
  const result = prettyFormat({
    test: {
      nested: jestExpect.objectContaining({
        a: jestExpect.arrayContaining([1]),
        b: jestExpect.anything(),
        c: jestExpect.any(String),
        d: jestExpect.stringMatching('jest'),
        e: jestExpect.objectContaining({test: 'case'}),
      }),
    },
  }, options);
  expect(result).toEqual(
`Object {
  "test": Object {
    "nested": <objectContaining(Object {
      "a": <arrayContaining(Array [
        1,
      ])>,
      "b": <anything>,
      "c": <any(String)>,
      "d": <stringMatching(/jest/)>,
      "e": <objectContaining(Object {
        "test": "case",
      })>,
    })>,
  },
}`
  );
});

test(`supports minified output`, () => {
  options.min = true;
  const result = prettyFormat({
    test: {
      nested: jestExpect.objectContaining({
        a: jestExpect.arrayContaining([1]),
        b: jestExpect.anything(),
        c: jestExpect.any(String),
        d: jestExpect.stringMatching('jest'),
        e: jestExpect.objectContaining({test: 'case'}),
      }),
    },
  }, options);
  expect(result).toEqual(
`{"test": {"nested": <objectContaining({"a": <arrayContaining([1])>, "b": <anything>, "c": <any(String)>, "d": <stringMatching(/jest/)>, "e": <objectContaining({"test": "case"})>})>}}`
  );
});
