/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const React = require('react');
const Immutable = require('immutable');
const ReactElementPlugin = require('../plugins/ReactElement');
const ReactTestComponentPlugin = require('../plugins/ReactTestComponent');
const ImmutablePlugins = require('../plugins/ImmutablePlugins');
const toPrettyPrintTo = require('./expect-util').getPrettyPrint(
  [ReactElementPlugin, ReactTestComponentPlugin].concat(ImmutablePlugins),
);

expect.extend({toPrettyPrintTo});

describe('Immutable.OrderedSet plugin', () => {
  it('supports an empty set', () => {
    expect(
      Immutable.OrderedSet([]),
    ).toPrettyPrintTo('Immutable.OrderedSet []', {min: true});
  });

  it('supports a single string element', () => {
    expect(
      Immutable.OrderedSet(['foo']),
    ).toPrettyPrintTo('Immutable.OrderedSet ["foo"]', {min: true});
  });

  it('supports a single integer element', () => {
    expect(
      Immutable.OrderedSet([1]),
    ).toPrettyPrintTo('Immutable.OrderedSet [1]', {min: true});
  });

  it('supports multiple string elements {min: true}', () => {
    expect(
      Immutable.OrderedSet(['jhon', 'mike', 'cristian']),
    ).toPrettyPrintTo('Immutable.OrderedSet ["jhon", "mike", "cristian"]', {
      min: true,
    });
  });

  it('supports multiple string elements {min: false}', () => {
    expect(
      Immutable.OrderedSet(['jhon', 'mike', 'cristian']),
    ).toPrettyPrintTo(
      'Immutable.OrderedSet [\n  "jhon",\n  "mike",\n  "cristian",\n]',
      {min: false},
    );
  });

  it('supports multiple integer elements {min: true}', () => {
    expect(
      Immutable.OrderedSet([1, 2, 3]),
    ).toPrettyPrintTo('Immutable.OrderedSet [1, 2, 3]', {min: true});
  });

  it('supports multiple integer elements {min: false}', () => {
    expect(
      Immutable.OrderedSet([1, 2, 3]),
    ).toPrettyPrintTo('Immutable.OrderedSet [\n  1,\n  2,\n  3,\n]', {
      min: false,
    });
  });

  it('supports object elements {min: true}', () => {
    expect(
      Immutable.OrderedSet([{a: 1, b: 2, c: 3}]),
    ).toPrettyPrintTo('Immutable.OrderedSet [{"a": 1, "b": 2, "c": 3}]', {
      min: true,
    });
  });

  it('supports object elements {min: false}', () => {
    expect(
      Immutable.OrderedSet([{a: 1, b: 2, c: 3}]),
    ).toPrettyPrintTo(
      'Immutable.OrderedSet [\n  Object {\n    "a": 1,\n    "b": 2,\n    "c": 3,\n  },\n]',
      {min: false},
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.OrderedSet([reactComponent, reactComponent]),
    ).toPrettyPrintTo('Immutable.OrderedSet [<Mouse>Hello World</Mouse>]', {
      min: true,
    });
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.OrderedSet([reactComponent, reactComponent]),
    ).toPrettyPrintTo(
      'Immutable.OrderedSet [\n  <Mouse>\n    Hello World\n  </Mouse>,\n]',
      {min: false},
    );
  });
});

describe('Immutable.List plugin', () => {
  it('supports an empty set', () => {
    expect(Immutable.List([])).toPrettyPrintTo('Immutable.List []', {
      min: true,
    });
  });

  it('supports a single string element', () => {
    expect(Immutable.List(['foo'])).toPrettyPrintTo('Immutable.List ["foo"]', {
      min: true,
    });
  });

  it('supports a single integer element', () => {
    expect(Immutable.List([1])).toPrettyPrintTo('Immutable.List [1]', {
      min: true,
    });
  });

  it('supports multiple string elements {min: true}', () => {
    expect(
      Immutable.List(['jhon', 'mike', 'cristian']),
    ).toPrettyPrintTo('Immutable.List ["jhon", "mike", "cristian"]', {
      min: true,
    });
  });

  it('supports multiple string elements {min: false}', () => {
    expect(Immutable.List(['jhon', 'mike', 'cristian'])).toPrettyPrintTo(
      'Immutable.List [\n  "jhon",\n  "mike",\n  "cristian",\n]',
    );
  });

  it('supports multiple integer elements {min: true}', () => {
    expect(
      Immutable.List([1, 2, 3]),
    ).toPrettyPrintTo('Immutable.List [1, 2, 3]', {min: true});
  });

  it('supports multiple integer elements {min: false}', () => {
    expect(Immutable.List([1, 2, 3])).toPrettyPrintTo(
      'Immutable.List [\n  1,\n  2,\n  3,\n]',
    );
  });

  it('supports object elements {min: true}', () => {
    expect(
      Immutable.List([{a: 1, b: 2, c: 3}]),
    ).toPrettyPrintTo('Immutable.List [{"a": 1, "b": 2, "c": 3}]', {min: true});
  });

  it('supports object elements {min: false}', () => {
    expect(Immutable.List([{a: 1, b: 2, c: 3}])).toPrettyPrintTo(
      'Immutable.List [\n  Object {\n    "a": 1,\n    "b": 2,\n    "c": 3,\n  },\n]',
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.List([reactComponent, reactComponent]),
    ).toPrettyPrintTo(
      'Immutable.List [<Mouse>Hello World</Mouse>, <Mouse>Hello World</Mouse>]',
      {min: true},
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(Immutable.List([reactComponent, reactComponent])).toPrettyPrintTo(
      'Immutable.List [\n  <Mouse>\n    Hello World\n  </Mouse>,\n  <Mouse>\n    Hello World\n  </Mouse>,\n]',
    );
  });
});

describe('Immutable.Stack plugin', () => {
  it('supports an empty set', () => {
    expect(Immutable.Stack([])).toPrettyPrintTo('Immutable.Stack []', {
      min: true,
    });
  });

  it('supports a single string element', () => {
    expect(
      Immutable.Stack(['foo']),
    ).toPrettyPrintTo('Immutable.Stack ["foo"]', {min: true});
  });

  it('supports a single integer element', () => {
    expect(Immutable.Stack([1])).toPrettyPrintTo('Immutable.Stack [1]', {
      min: true,
    });
  });

  it('supports multiple string elements {min: true}', () => {
    expect(
      Immutable.Stack(['jhon', 'mike', 'cristian']),
    ).toPrettyPrintTo('Immutable.Stack ["jhon", "mike", "cristian"]', {
      min: true,
    });
  });

  it('supports multiple string elements {min: false}', () => {
    expect(Immutable.Stack(['jhon', 'mike', 'cristian'])).toPrettyPrintTo(
      'Immutable.Stack [\n  "jhon",\n  "mike",\n  "cristian",\n]',
    );
  });

  it('supports multiple integer elements {min: true}', () => {
    expect(
      Immutable.Stack([1, 2, 3]),
    ).toPrettyPrintTo('Immutable.Stack [1, 2, 3]', {min: true});
  });

  it('supports multiple integer elements {min: false}', () => {
    expect(Immutable.Stack([1, 2, 3])).toPrettyPrintTo(
      'Immutable.Stack [\n  1,\n  2,\n  3,\n]',
    );
  });

  it('supports object elements {min: true}', () => {
    expect(
      Immutable.Stack([{a: 1, b: 2, c: 3}]),
    ).toPrettyPrintTo('Immutable.Stack [{"a": 1, "b": 2, "c": 3}]', {
      min: true,
    });
  });

  it('supports object elements {min: false}', () => {
    expect(Immutable.Stack([{a: 1, b: 2, c: 3}])).toPrettyPrintTo(
      'Immutable.Stack [\n  Object {\n    "a": 1,\n    "b": 2,\n    "c": 3,\n  },\n]',
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.Stack([reactComponent, reactComponent]),
    ).toPrettyPrintTo(
      'Immutable.Stack [<Mouse>Hello World</Mouse>, <Mouse>Hello World</Mouse>]',
      {min: true},
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(Immutable.Stack([reactComponent, reactComponent])).toPrettyPrintTo(
      'Immutable.Stack [\n  <Mouse>\n    Hello World\n  </Mouse>,\n  <Mouse>\n    Hello World\n  </Mouse>,\n]',
    );
  });
});

describe('Immutable.Set plugin', () => {
  it('supports an empty set', () => {
    expect(Immutable.Set([])).toPrettyPrintTo('Immutable.Set []', {min: true});
  });

  it('supports a single string element', () => {
    expect(Immutable.Set(['foo'])).toPrettyPrintTo('Immutable.Set ["foo"]', {
      min: true,
    });
  });

  it('supports a single integer element', () => {
    expect(Immutable.Set([1])).toPrettyPrintTo('Immutable.Set [1]', {
      min: true,
    });
  });

  it('supports multiple string elements {min: true}', () => {
    expect(
      Immutable.Set(['jhon', 'mike', 'cristian']),
    ).toPrettyPrintTo('Immutable.Set ["jhon", "mike", "cristian"]', {
      min: true,
    });
  });

  it('supports multiple string elements {min: false}', () => {
    expect(Immutable.Set(['jhon', 'mike', 'cristian'])).toPrettyPrintTo(
      'Immutable.Set [\n  "jhon",\n  "mike",\n  "cristian",\n]',
    );
  });

  it('supports multiple integer elements {min: true}', () => {
    expect(
      Immutable.Set([1, 2, 3]),
    ).toPrettyPrintTo('Immutable.Set [1, 2, 3]', {min: true});
  });

  it('supports multiple integer elements {min: false}', () => {
    expect(Immutable.Set([1, 2, 3])).toPrettyPrintTo(
      'Immutable.Set [\n  1,\n  2,\n  3,\n]',
    );
  });

  it('supports object elements {min: true}', () => {
    expect(
      Immutable.Set([{a: 1, b: 2, c: 3}]),
    ).toPrettyPrintTo('Immutable.Set [{"a": 1, "b": 2, "c": 3}]', {min: true});
  });

  it('supports object elements {min: false}', () => {
    expect(Immutable.Set([{a: 1, b: 2, c: 3}])).toPrettyPrintTo(
      'Immutable.Set [\n  Object {\n    "a": 1,\n    "b": 2,\n    "c": 3,\n  },\n]',
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.Set([reactComponent, reactComponent]),
    ).toPrettyPrintTo('Immutable.Set [<Mouse>Hello World</Mouse>]', {
      min: true,
    });
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(Immutable.Set([reactComponent, reactComponent])).toPrettyPrintTo(
      'Immutable.Set [\n  <Mouse>\n    Hello World\n  </Mouse>,\n]',
    );
  });
});

describe('Immutable.Map plugin', () => {
  it('supports an empty set', () => {
    expect(Immutable.Map({})).toPrettyPrintTo('Immutable.Map {}', {min: true});
  });

  it('supports an object with single key', () => {
    expect(Immutable.Map({a: 1})).toPrettyPrintTo('Immutable.Map {a: 1}', {
      min: true,
    });
  });

  it('supports an object with multiple keys {min: true}', () => {
    expect(
      Immutable.Map({a: 1, b: 2, c: 3}),
    ).toPrettyPrintTo('Immutable.Map {a: 1, b: 2, c: 3}', {min: true});
  });

  it('supports an object with multiple keys {min: false}', () => {
    expect(Immutable.Map({a: 1, b: 2, c: 3})).toPrettyPrintTo(
      'Immutable.Map {\n  a: 1,\n  b: 2,\n  c: 3,\n}',
    );
  });

  it('supports object elements {min: true}', () => {
    expect(
      Immutable.Map({key: {a: 1, b: 2, c: 3}}),
    ).toPrettyPrintTo('Immutable.Map {key: {"a": 1, "b": 2, "c": 3}}', {
      min: true,
    });
  });

  it('supports object elements {min: false}', () => {
    expect(Immutable.Map({key: {a: 1, b: 2, c: 3}})).toPrettyPrintTo(
      'Immutable.Map {\n  key: Object {\n    "a": 1,\n    "b": 2,\n    "c": 3,\n  },\n}',
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.Map({a: reactComponent, b: reactComponent}),
    ).toPrettyPrintTo(
      'Immutable.Map {a: <Mouse>Hello World</Mouse>, b: <Mouse>Hello World</Mouse>}',
      {min: true},
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.Map({a: reactComponent, b: reactComponent}),
    ).toPrettyPrintTo(
      'Immutable.Map {\n  a: <Mouse>\n    Hello World\n  </Mouse>,\n  b: <Mouse>\n    Hello World\n  </Mouse>,\n}',
    );
  });
});

describe('Immutable.OrderedMap plugin', () => {
  it('supports an empty set', () => {
    expect(
      Immutable.OrderedMap({}),
    ).toPrettyPrintTo('Immutable.OrderedMap {}', {min: true});
  });

  it('supports an object with single key', () => {
    expect(
      Immutable.OrderedMap({a: 1}),
    ).toPrettyPrintTo('Immutable.OrderedMap {a: 1}', {min: true});
  });

  it('supports an object with multiple keys {min: true}', () => {
    expect(
      Immutable.OrderedMap({a: 1, b: 2, c: 3}),
    ).toPrettyPrintTo('Immutable.OrderedMap {a: 1, b: 2, c: 3}', {min: true});
  });

  it('supports an object with multiple keys {min: false}', () => {
    expect(Immutable.OrderedMap({a: 1, b: 2, c: 3})).toPrettyPrintTo(
      'Immutable.OrderedMap {\n  a: 1,\n  b: 2,\n  c: 3,\n}',
    );
  });

  it('supports object elements {min: true}', () => {
    expect(
      Immutable.OrderedMap({key: {a: 1, b: 2, c: 3}}),
    ).toPrettyPrintTo('Immutable.OrderedMap {key: {"a": 1, "b": 2, "c": 3}}', {
      min: true,
    });
  });

  it('supports object elements {min: false}', () => {
    expect(Immutable.OrderedMap({key: {a: 1, b: 2, c: 3}})).toPrettyPrintTo(
      'Immutable.OrderedMap {\n  key: Object {\n    "a": 1,\n    "b": 2,\n    "c": 3,\n  },\n}',
    );
  });

  it('supports React components {min: true}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.OrderedMap({a: reactComponent, b: reactComponent}),
    ).toPrettyPrintTo(
      'Immutable.OrderedMap {a: <Mouse>Hello World</Mouse>, b: <Mouse>Hello World</Mouse>}',
      {min: true},
    );
  });

  it('supports React components {min: false}', () => {
    const reactComponent = React.createElement('Mouse', null, 'Hello World');
    expect(
      Immutable.OrderedMap({a: reactComponent, b: reactComponent}),
    ).toPrettyPrintTo(
      'Immutable.OrderedMap {\n  a: <Mouse>\n    Hello World\n  </Mouse>,\n  b: <Mouse>\n    Hello World\n  </Mouse>,\n}',
    );
  });
});
