/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import type {ExpectationResult} from 'expect';
import {
  type Context,
  type SnapshotState,
  toMatchInlineSnapshot,
  toMatchSnapshot,
  toThrowErrorMatchingInlineSnapshot,
  toThrowErrorMatchingSnapshot,
} from 'jest-snapshot';

// Context

expect(({} as Context).snapshotState).type.toBe<SnapshotState>();

// toMatchSnapshot

expect(
  toMatchSnapshot.call({} as Context, {received: 'value'}),
).type.toBe<ExpectationResult>();

expect(
  toMatchSnapshot.call({} as Context, {received: 'value'}, 'someHint'),
).type.toBe<ExpectationResult>();

expect(
  toMatchSnapshot.call({} as Context, {received: 'value'}, {property: 'match'}),
).type.toBe<ExpectationResult>();

expect(
  toMatchSnapshot.call(
    {} as Context,
    {received: 'value'},
    {property: 'match'},
    'someHint',
  ),
).type.toBe<ExpectationResult>();

expect(toMatchSnapshot).type.not.toBeCallableWith({received: 'value'});

// toMatchInlineSnapshot

expect(
  toMatchInlineSnapshot.call({} as Context, {received: 'value'}),
).type.toBe<ExpectationResult>();

expect(
  toMatchInlineSnapshot.call(
    {} as Context,
    {received: 'value'},
    'inlineSnapshot',
  ),
).type.toBe<ExpectationResult>();

expect(
  toMatchInlineSnapshot.call(
    {} as Context,
    {received: 'value'},
    {property: 'match'},
  ),
).type.toBe<ExpectationResult>();

expect(
  toMatchInlineSnapshot.call(
    {} as Context,
    {received: 'value'},
    {property: 'match'},
    'inlineSnapshot',
  ),
).type.toBe<ExpectationResult>();

expect(toMatchInlineSnapshot).type.not.toBeCallableWith({received: 'value'});

// toThrowErrorMatchingSnapshot

expect(
  toThrowErrorMatchingSnapshot.call({} as Context, new Error('received')),
).type.toBe<ExpectationResult>();

expect(
  toThrowErrorMatchingSnapshot.call(
    {} as Context,
    new Error('received'),
    'someHint',
  ),
).type.toBe<ExpectationResult>();

expect(
  toThrowErrorMatchingSnapshot.call(
    {} as Context,
    new Error('received'),
    'someHint',
    true, // fromPromise
  ),
).type.toBe<ExpectationResult>();

expect(
  toThrowErrorMatchingSnapshot.call(
    {} as Context,
    new Error('received'),
    undefined,
    false, // fromPromise
  ),
).type.toBe<ExpectationResult>();

expect(toThrowErrorMatchingSnapshot).type.not.toBeCallableWith({
  received: 'value',
});

// toThrowErrorMatchingInlineSnapshot

expect(
  toThrowErrorMatchingInlineSnapshot.call({} as Context, new Error('received')),
).type.toBe<ExpectationResult>();

expect(
  toThrowErrorMatchingInlineSnapshot.call(
    {} as Context,
    new Error('received'),
    'inlineSnapshot',
  ),
).type.toBe<ExpectationResult>();

expect(
  toThrowErrorMatchingInlineSnapshot.call(
    {} as Context,
    new Error('received'),
    'inlineSnapshot',
    true, // fromPromise
  ),
).type.toBe<ExpectationResult>();

expect(
  toThrowErrorMatchingInlineSnapshot.call(
    {} as Context,
    new Error('received'),
    undefined,
    false, // fromPromise
  ),
).type.toBe<ExpectationResult>();

expect(toThrowErrorMatchingInlineSnapshot).type.not.toBeCallableWith({
  received: 'value',
});
