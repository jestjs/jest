/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const prettyFormat = require('../');
const Immutable = require('immutable');
const ImmutableOrderedSet = require('../plugins/ImmutableOrderedSet');
const ImmutableList = require('../plugins/ImmutableList');

function assertImmutableObject(actual, expected, opts) {
  expect(
    prettyFormat(actual, Object.assign({
      plugins: [ImmutableOrderedSet, ImmutableList],
    }, opts))
  ).toEqual(expected);
}

describe('ImmutableOrderedSet plugin', () => {
  it('supports an empty set', () => {
    assertImmutableObject(
      Immutable.OrderedSet([]),
      'Immutable.OrderedSet {}'
    );
  });

  it('supports a single string element', () => {
    assertImmutableObject(
      Immutable.OrderedSet(['foo']),
      'Immutable.OrderedSet { "foo" }'
    );
  });

  it('supports a single integer element', () => {
    assertImmutableObject(
      Immutable.OrderedSet([1]),
      'Immutable.OrderedSet { 1 }'
    );
  });

  it('supports multiple string elements', () => {
    assertImmutableObject(
      Immutable.OrderedSet(['jhon', 'mike', 'cristian']),
      'Immutable.OrderedSet { "jhon", "mike", "cristian" }'
    );
  });

  it('supports multiple integer elements', () => {
    assertImmutableObject(
      Immutable.OrderedSet([1, 2, 3]),
      'Immutable.OrderedSet { 1, 2, 3 }'
    );
  });
});

describe('ImmutableList plugin', () => {
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
});
