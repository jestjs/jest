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
const ReactElementPlugin = require('../plugins/ReactElement');
const ReactTestComponentPlugin = require('../plugins/ReactTestComponent');
const ImmutablePlugins = require('../plugins/ImmutablePlugins');

function assertImmutableObject(actual, expected, opts) {
  expect(
    prettyFormat(actual, Object.assign({
      plugins: [
        ReactElementPlugin,
        ReactTestComponentPlugin,
      ].concat(ImmutablePlugins),
    }, opts))
  ).toEqual(expected);
}

describe('Immutable.OrderedSet plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.OrderedSet([]),
      'Immutable.OrderedSet []',
      {min: true}
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.OrderedSet(['foo']),
      'Immutable.OrderedSet ["foo"]',
      {min: true}
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.OrderedSet([1]),
      'Immutable.OrderedSet [1]',
      {min: true}
    );
  });

  it('supports multiple string elements {min: true}', () => {
    assertImmutableObject(
      Immutable.OrderedSet(['jhon', 'mike', 'cristian']),
      'Immutable.OrderedSet ["jhon", "mike", "cristian"]',
      {min: true}
    );
  });

  it('supports multiple string elements {min: false}', () => {
    assertImmutableObject(
      Immutable.OrderedSet(['jhon', 'mike', 'cristian']),
      'Immutable.OrderedSet [\n  "jhon",\n  "mike",\n  "cristian"\n]'
    );
  });

  it('supports multiple integer elements {min: true}', () => {
    assertImmutableObject(
      Immutable.OrderedSet([1, 2, 3]),
      'Immutable.OrderedSet [1, 2, 3]',
      {min: true}
    );
  });

  it('supports multiple integer elements {min: false}', () => {
    assertImmutableObject(
      Immutable.OrderedSet([1, 2, 3]),
      'Immutable.OrderedSet [\n  1,\n  2,\n  3\n]'
    );
  });

  it('supports object elements {min: true}', () => {
    assertImmutableObject(
      Immutable.OrderedSet([{a: 1, b: 2, c: 3}]),
      'Immutable.OrderedSet [{\"a\": 1, \"b\": 2, \"c\": 3}]',
      {min: true}
    );
  });

  it('supports object elements {min: false}', () => {
    assertImmutableObject(
      Immutable.OrderedSet([{a: 1, b: 2, c: 3}]),
      'Immutable.OrderedSet [\n  Object {\n    \"a\": 1,\n    \"b\": 2,\n    \"c\": 3,\n  }\n]'
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.OrderedSet([reactComponent, reactComponent]),
      'Immutable.OrderedSet [<Mouse>Hello World</Mouse>]',
      {min: true}
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.OrderedSet([reactComponent, reactComponent]),
      'Immutable.OrderedSet [\n  <Mouse>\n    Hello World\n  </Mouse>\n]'
    );
  });
});

describe('Immutable.List plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.List([]),
      'Immutable.List []',
      {min: true}
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.List(['foo']),
      'Immutable.List ["foo"]',
      {min: true}
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.List([1]),
      'Immutable.List [1]',
      {min: true}
    );
  });

  it('supports multiple string elements {min: true}', () => {
    assertImmutableObject(
      Immutable.List(['jhon', 'mike', 'cristian']),
      'Immutable.List ["jhon", "mike", "cristian"]',
      {min: true}
    );
  });

  it('supports multiple string elements {min: false}', () => {
    assertImmutableObject(
      Immutable.List(['jhon', 'mike', 'cristian']),
      'Immutable.List [\n  "jhon",\n  "mike",\n  "cristian"\n]'
    );
  });

  it('supports multiple integer elements {min: true}', () => {
    assertImmutableObject(
      Immutable.List([1, 2, 3]),
      'Immutable.List [1, 2, 3]',
      {min: true}
    );
  });

  it('supports multiple integer elements {min: false}', () => {
    assertImmutableObject(
      Immutable.List([1, 2, 3]),
      'Immutable.List [\n  1,\n  2,\n  3\n]'
    );
  });

  it('supports object elements {min: true}', () => {
    assertImmutableObject(
      Immutable.List([{a: 1, b: 2, c: 3}]),
      'Immutable.List [{\"a\": 1, \"b\": 2, \"c\": 3}]',
      {min: true}
    );
  });

  it('supports object elements {min: false}', () => {
    assertImmutableObject(
      Immutable.List([{a: 1, b: 2, c: 3}]),
      'Immutable.List [\n  Object {\n    \"a\": 1,\n    \"b\": 2,\n    \"c\": 3,\n  }\n]'
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.List([reactComponent, reactComponent]),
      'Immutable.List [<Mouse>Hello World</Mouse>, <Mouse>Hello World</Mouse>]',
      {min: true}
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.List([reactComponent, reactComponent]),
      'Immutable.List [\n  <Mouse>\n    Hello World\n  </Mouse>,\n  <Mouse>\n    Hello World\n  </Mouse>\n]'
    );
  });
});

describe('Immutable.Stack plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.Stack([]),
      'Immutable.Stack []',
      {min: true}
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.Stack(['foo']),
      'Immutable.Stack ["foo"]',
      {min: true}
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.Stack([1]),
      'Immutable.Stack [1]',
      {min: true}
    );
  });

  it('supports multiple string elements {min: true}', () => {
    assertImmutableObject(
      Immutable.Stack(['jhon', 'mike', 'cristian']),
      'Immutable.Stack ["jhon", "mike", "cristian"]',
      {min: true}
    );
  });

  it('supports multiple string elements {min: false}', () => {
    assertImmutableObject(
      Immutable.Stack(['jhon', 'mike', 'cristian']),
      'Immutable.Stack [\n  "jhon",\n  "mike",\n  "cristian"\n]'
    );
  });

  it('supports multiple integer elements {min: true}', () => {
    assertImmutableObject(
      Immutable.Stack([1, 2, 3]),
      'Immutable.Stack [1, 2, 3]',
      {min: true}
    );
  });

  it('supports multiple integer elements {min: false}', () => {
    assertImmutableObject(
      Immutable.Stack([1, 2, 3]),
      'Immutable.Stack [\n  1,\n  2,\n  3\n]'
    );
  });

  it('supports object elements {min: true}', () => {
    assertImmutableObject(
      Immutable.Stack([{a: 1, b: 2, c: 3}]),
      'Immutable.Stack [{\"a\": 1, \"b\": 2, \"c\": 3}]',
      {min: true}
    );
  });

  it('supports object elements {min: false}', () => {
    assertImmutableObject(
      Immutable.Stack([{a: 1, b: 2, c: 3}]),
      'Immutable.Stack [\n  Object {\n    \"a\": 1,\n    \"b\": 2,\n    \"c\": 3,\n  }\n]'
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Stack([reactComponent, reactComponent]),
      'Immutable.Stack [<Mouse>Hello World</Mouse>, <Mouse>Hello World</Mouse>]',
      {min: true}
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Stack([reactComponent, reactComponent]),
      'Immutable.Stack [\n  <Mouse>\n    Hello World\n  </Mouse>,\n  <Mouse>\n    Hello World\n  </Mouse>\n]'
    );
  });
});

describe('Immutable.Set plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.Set([]),
      'Immutable.Set []',
      {min: true}
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.Set(['foo']),
      'Immutable.Set ["foo"]',
      {min: true}
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.Set([1]),
      'Immutable.Set [1]',
      {min: true}
    );
  });

  it('supports multiple string elements {min: true}', () => {
    assertImmutableObject(
      Immutable.Set(['jhon', 'mike', 'cristian']),
      'Immutable.Set ["jhon", "mike", "cristian"]',
      {min: true}
    );
  });

  it('supports multiple string elements {min: false}', () => {
    assertImmutableObject(
      Immutable.Set(['jhon', 'mike', 'cristian']),
      'Immutable.Set [\n  "jhon",\n  "mike",\n  "cristian"\n]'
    );
  });

  it('supports multiple integer elements {min: true}', () => {
    assertImmutableObject(
      Immutable.Set([1, 2, 3]),
      'Immutable.Set [1, 2, 3]',
      {min: true}
    );
  });

  it('supports multiple integer elements {min: false}', () => {
    assertImmutableObject(
      Immutable.Set([1, 2, 3]),
      'Immutable.Set [\n  1,\n  2,\n  3\n]'
    );
  });

  it('supports object elements {min: true}', () => {
    assertImmutableObject(
      Immutable.Set([{a: 1, b: 2, c: 3}]),
      'Immutable.Set [{\"a\": 1, \"b\": 2, \"c\": 3}]',
      {min: true}
    );
  });

  it('supports object elements {min: false}', () => {
    assertImmutableObject(
      Immutable.Set([{a: 1, b: 2, c: 3}]),
      'Immutable.Set [\n  Object {\n    \"a\": 1,\n    \"b\": 2,\n    \"c\": 3,\n  }\n]'
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Set([reactComponent, reactComponent]),
      'Immutable.Set [<Mouse>Hello World</Mouse>]',
      {min: true}
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Set([reactComponent, reactComponent]),
      'Immutable.Set [\n  <Mouse>\n    Hello World\n  </Mouse>\n]'
    );
  });
});

describe('Immutable.Map plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.Map({}),
      'Immutable.Map {}',
      {min: true}
    );
  });

  it('supports an object with single key', () => {
    assertImmutableObject(
      Immutable.Map({a: 1}),
      'Immutable.Map {a: 1}',
      {min: true}
    );
  });

  it('supports an object with multiple keys {min: true}', () => {
    assertImmutableObject(
      Immutable.Map({a: 1, b: 2, c: 3}),
      'Immutable.Map {a: 1, b: 2, c: 3}',
      {min: true}
    );
  });

  it('supports an object with multiple keys {min: false}', () => {
    assertImmutableObject(
      Immutable.Map({a: 1, b: 2, c: 3}),
      'Immutable.Map {\n  a: 1,\n  b: 2,\n  c: 3\n}'
    );
  });

  it('supports object elements {min: true}', () => {
    assertImmutableObject(
      Immutable.Map({key: {a: 1, b: 2, c: 3}}),
      'Immutable.Map {key: {\"a\": 1, \"b\": 2, \"c\": 3}}',
      {min: true}
    );
  });

  it('supports object elements {min: false}', () => {
    assertImmutableObject(
      Immutable.Map({key: {a: 1, b: 2, c: 3}}),
      'Immutable.Map {\n  key: Object {\n    \"a\": 1,\n    \"b\": 2,\n    \"c\": 3,\n  }\n}'
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Map({a: reactComponent, b: reactComponent}),
      'Immutable.Map {a: <Mouse>Hello World</Mouse>, b: <Mouse>Hello World</Mouse>}',
      {min: true}
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.Map({a: reactComponent, b: reactComponent}),
      'Immutable.Map {\n  a: <Mouse>\n    Hello World\n  </Mouse>,\n  b: <Mouse>\n    Hello World\n  </Mouse>\n}'
    );
  });
});

describe('Immutable.OrderedMap plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.OrderedMap({}),
      'Immutable.OrderedMap {}',
      {min: true}
    );
  });

  it('supports an object with single key', () => {
    assertImmutableObject(
      Immutable.OrderedMap({a: 1}),
      'Immutable.OrderedMap {a: 1}',
      {min: true}
    );
  });

  it('supports an object with multiple keys {min: true}', () => {
    assertImmutableObject(
      Immutable.OrderedMap({a: 1, b: 2, c: 3}),
      'Immutable.OrderedMap {a: 1, b: 2, c: 3}',
      {min: true}
    );
  });

  it('supports an object with multiple keys {min: false}', () => {
    assertImmutableObject(
      Immutable.OrderedMap({a: 1, b: 2, c: 3}),
      'Immutable.OrderedMap {\n  a: 1,\n  b: 2,\n  c: 3\n}'
    );
  });

  it('supports object elements {min: true}', () => {
    assertImmutableObject(
      Immutable.OrderedMap({key: {a: 1, b: 2, c: 3}}),
      'Immutable.OrderedMap {key: {\"a\": 1, \"b\": 2, \"c\": 3}}',
      {min: true}
    );
  });

  it('supports object elements {min: false}', () => {
    assertImmutableObject(
      Immutable.OrderedMap({key: {a: 1, b: 2, c: 3}}),
      'Immutable.OrderedMap {\n  key: Object {\n    \"a\": 1,\n    \"b\": 2,\n    \"c\": 3,\n  }\n}'
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.OrderedMap({a: reactComponent, b: reactComponent}),
      'Immutable.OrderedMap {a: <Mouse>Hello World</Mouse>, b: <Mouse>Hello World</Mouse>}',
      {min: true}
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    assertImmutableObject(
      Immutable.OrderedMap({a: reactComponent, b: reactComponent}),
      'Immutable.OrderedMap {\n  a: <Mouse>\n    Hello World\n  </Mouse>,\n  b: <Mouse>\n    Hello World\n  </Mouse>\n}'
    );
  });
});
