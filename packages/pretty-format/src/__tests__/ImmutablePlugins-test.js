/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
 /* eslint-disable max-len */

'use strict';

const React = require('react');
const prettyFormat = require('../');
const Immutable = require('immutable');
const ImmutableOrderedSet = require('../plugins/ImmutableOrderedSet');
const ImmutableList = require('../plugins/ImmutableList');
const ImmutableStack = require('../plugins/ImmutableStack');
const ImmutableSet = require('../plugins/ImmutableSet');
const ImmutableMap = require('../plugins/ImmutableMap');
const ImmutableOrderedMap = require('../plugins/ImmutableOrderedMap');

function assertImmutableObject(actual, expected, opts) {
  expect(
    prettyFormat(actual, Object.assign({
      plugins: [
        ImmutableOrderedSet, 
        ImmutableList, 
        ImmutableOrderedMap,
        ImmutableMap,
        ImmutableSet,
        ImmutableStack,
      ],
    }, opts))
  ).toEqual(expected);
}

describe('Immutable.OrderedSet plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.OrderedSet([]),
      'Immutable.OrderedSet []'
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.OrderedSet(['foo']),
      'Immutable.OrderedSet [ "foo" ]'
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.OrderedSet([1]),
      'Immutable.OrderedSet [ 1 ]'
    );
  });

  it('supports multiple string elements', () => {
    assertImmutableObject(
      Immutable.OrderedSet(['jhon', 'mike', 'cristian']),
      'Immutable.OrderedSet [ "jhon", "mike", "cristian" ]'
    );
  });

  it('supports multiple integer elements', () => {
    assertImmutableObject(
      Immutable.OrderedSet([1, 2, 3]),
      'Immutable.OrderedSet [ 1, 2, 3 ]'
    );
  });

  it('supports object elements', () => {
    assertImmutableObject(
      Immutable.OrderedSet([{a: 1, b: 2, c: 3}]),
      'Immutable.OrderedSet [ Object {\n  \"a\": 1,\n  \"b\": 2,\n  \"c\": 3,\n} ]'
    );
  });

  it('supports React components', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.OrderedSet([reactComponent, reactComponent]),
      'Immutable.OrderedSet [ <Mouse>\n  Hello World\n</Mouse> ]'
    );
  });
});

describe('Immutable.List plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.List([]),
      'Immutable.List []'
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.List(['foo']),
      'Immutable.List [ "foo" ]'
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.List([1]),
      'Immutable.List [ 1 ]'
    );
  });

  it('supports multiple string elements', () => {
    assertImmutableObject(
      Immutable.List(['jhon', 'mike', 'cristian']),
      'Immutable.List [ "jhon", "mike", "cristian" ]'
    );
  });

  it('supports multiple integer elements', () => {
    assertImmutableObject(
      Immutable.List([1, 2, 3]),
      'Immutable.List [ 1, 2, 3 ]'
    );
  });

  it('supports object elements', () => {
    assertImmutableObject(
      Immutable.List([{a: 1, b: 2, c: 3}]),
      'Immutable.List [ Object {\n  \"a\": 1,\n  \"b\": 2,\n  \"c\": 3,\n} ]'
    );
  });

  it('supports React components', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.List([reactComponent, reactComponent]),
      'Immutable.List [ <Mouse>\n  Hello World\n</Mouse>, <Mouse>\n  Hello World\n</Mouse> ]'
    );
  });
});

describe('Immutable.Stack plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.Stack([]),
      'Immutable.Stack []'
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.Stack(['foo']),
      'Immutable.Stack [ "foo" ]'
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.Stack([1]),
      'Immutable.Stack [ 1 ]'
    );
  });

  it('supports multiple string elements', () => {
    assertImmutableObject(
      Immutable.Stack(['jhon', 'mike', 'cristian']),
      'Immutable.Stack [ "jhon", "mike", "cristian" ]'
    );
  });

  it('supports multiple integer elements', () => {
    assertImmutableObject(
      Immutable.Stack([1, 2, 3]),
      'Immutable.Stack [ 1, 2, 3 ]'
    );
  });

  it('supports object elements', () => {
    assertImmutableObject(
      Immutable.Stack([{a: 1, b: 2, c: 3}]),
      'Immutable.Stack [ Object {\n  \"a\": 1,\n  \"b\": 2,\n  \"c\": 3,\n} ]'
    );
  });

  it('supports React components', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Stack([reactComponent, reactComponent]),
      'Immutable.Stack [ <Mouse>\n  Hello World\n</Mouse>, <Mouse>\n  Hello World\n</Mouse> ]'
    );
  });
});

describe('Immutable.Set plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.Set([]),
      'Immutable.Set []'
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.Set(['foo']),
      'Immutable.Set [ "foo" ]'
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.Set([1]),
      'Immutable.Set [ 1 ]'
    );
  });

  it('supports multiple string elements', () => {
    assertImmutableObject(
      Immutable.Set(['jhon', 'mike', 'cristian']),
      'Immutable.Set [ "jhon", "mike", "cristian" ]'
    );
  });

  it('supports multiple integer elements', () => {
    assertImmutableObject(
      Immutable.Set([1, 2, 3]),
      'Immutable.Set [ 1, 2, 3 ]'
    );
  });

  it('supports object elements', () => {
    assertImmutableObject(
      Immutable.Set([{a: 1, b: 2, c: 3}]),
      'Immutable.Set [ Object {\n  \"a\": 1,\n  \"b\": 2,\n  \"c\": 3,\n} ]'
    );
  });

  it('supports React components', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Set([reactComponent, reactComponent]),
      'Immutable.Set [ <Mouse>\n  Hello World\n</Mouse> ]'
    );
  });
});

describe('Immutable.Map plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.Map({}),
      'Immutable.Map []'
    );
  });

  it('supports an object with single key', () => {
    assertImmutableObject(
      Immutable.Map({a: 1}),
      'Immutable.Map [ a: 1 ]'
    );
  });

  it('supports an object with multiple keys', () => {
    assertImmutableObject(
      Immutable.Map({a: 1, b: 2, c: 3}),
      'Immutable.Map [ a: 1, b: 2, c: 3 ]'
    );
  });

  it('supports object elements', () => {
    assertImmutableObject(
      Immutable.Map({key: {a: 1, b: 2, c: 3}}),
      'Immutable.Map [ key: Object {\n  \"a\": 1,\n  \"b\": 2,\n  \"c\": 3,\n} ]'
    );
  });

  it('supports React components', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Map({a: reactComponent, b: reactComponent}),
      'Immutable.Map [ a: <Mouse>\n  Hello World\n</Mouse>, b: <Mouse>\n  Hello World\n</Mouse> ]'
    );
  });
});

describe('Immutable.OrderedMap plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.OrderedMap({}),
      'Immutable.OrderedMap []'
    );
  });

  it('supports an object with single key', () => {
    assertImmutableObject(
      Immutable.OrderedMap({a: 1}),
      'Immutable.OrderedMap [ a: 1 ]'
    );
  });

  it('supports an object with multiple keys', () => {
    assertImmutableObject(
      Immutable.OrderedMap({a: 1, b: 2, c: 3}),
      'Immutable.OrderedMap [ a: 1, b: 2, c: 3 ]'
    );
  });

  it('supports object elements', () => {
    assertImmutableObject(
      Immutable.OrderedMap({key: {a: 1, b: 2, c: 3}}),
      'Immutable.OrderedMap [ key: Object {\n  \"a\": 1,\n  \"b\": 2,\n  \"c\": 3,\n} ]'
    );
  });

  it('supports React components', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.OrderedMap({a: reactComponent, b: reactComponent}),
      'Immutable.OrderedMap [ a: <Mouse>\n  Hello World\n</Mouse>, b: <Mouse>\n  Hello World\n</Mouse> ]'
    );
  });
});
