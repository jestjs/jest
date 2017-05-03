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
    const result = prettyFormat(expect.any(type), options);
    expect(result).toEqual(`Any<${fnNameFor(type)}>`);
  });

  test(`supports nested any(${fnNameFor(type)})`, () => {
    const result = prettyFormat(
      {
        test: {
          nested: expect.any(type),
        },
      },
      options,
    );
    expect(result)
      .toEqual(`Object {\n  "test": Object {\n    "nested": Any<${fnNameFor(type)}>,\n  },\n}`);
  });
});

test(`anything()`, () => {
  const result = prettyFormat(expect.anything(), options);
  expect(result).toEqual('Anything');
});

test(`arrayContaining()`, () => {
  const result = prettyFormat(expect.arrayContaining([1, 2]), options);
  expect(result).toEqual(`ArrayContaining [
  1,
  2,
]`);
});

test(`objectContaining()`, () => {
  const result = prettyFormat(expect.objectContaining({a: 'test'}), options);
  expect(result).toEqual(`ObjectContaining {
  "a": "test",
}`);
});

test(`stringContaining(string)`, () => {
  const result = prettyFormat(expect.stringContaining('jest'), options);
  expect(result).toEqual(`StringContaining "jest"`);
});

test(`stringMatching(string)`, () => {
  const result = prettyFormat(expect.stringMatching('jest'), options);
  expect(result).toEqual('StringMatching /jest/');
});

test(`stringMatching(regexp)`, () => {
  const result = prettyFormat(expect.stringMatching(/(jest|niema).*/), options);
  expect(result).toEqual('StringMatching /(jest|niema).*/');
});

test(`supports multiple nested asymmetric matchers`, () => {
  const result = prettyFormat(
    {
      test: {
        nested: expect.objectContaining({
          a: expect.arrayContaining([1]),
          b: expect.anything(),
          c: expect.any(String),
          d: expect.stringContaining('jest'),
          e: expect.stringMatching('jest'),
          f: expect.objectContaining({test: 'case'}),
        }),
      },
    },
    options,
  );
  expect(result).toEqual(`Object {
  "test": Object {
    "nested": ObjectContaining {
      "a": ArrayContaining [
        1,
      ],
      "b": Anything,
      "c": Any<String>,
      "d": StringContaining "jest",
      "e": StringMatching /jest/,
      "f": ObjectContaining {
        "test": "case",
      },
    },
  },
}`);
});

test(`supports minified output`, () => {
  options.min = true;
  const result = prettyFormat(
    {
      test: {
        nested: expect.objectContaining({
          a: expect.arrayContaining([1]),
          b: expect.anything(),
          c: expect.any(String),
          d: expect.stringContaining('jest'),
          e: expect.stringMatching('jest'),
          f: expect.objectContaining({test: 'case'}),
        }),
      },
    },
    options,
  );
  expect(result)
    .toEqual(`{"test": {"nested": ObjectContaining {"a": ArrayContaining [1], "b": Anything, "c": Any<String>, "d": StringContaining "jest", "e": StringMatching /jest/, "f": ObjectContaining {"test": "case"}}}}`);
});
