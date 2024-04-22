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

expect(({} as Context).snapshotState).type.toEqual<SnapshotState>();

// toMatchSnapshot

expect(
  toMatchSnapshot.call({} as Context, {received: 'value'}),
).type.toEqual<ExpectationResult>();

expect(
  toMatchSnapshot.call({} as Context, {received: 'value'}, 'someHint'),
).type.toEqual<ExpectationResult>();

expect(
  toMatchSnapshot.call({} as Context, {received: 'value'}, {property: 'match'}),
).type.toEqual<ExpectationResult>();

expect(
  toMatchSnapshot.call(
    {} as Context,
    {received: 'value'},
    {property: 'match'},
    'someHint',
  ),
).type.toEqual<ExpectationResult>();

expect(toMatchSnapshot({received: 'value'})).type.toRaiseError();

// toMatchInlineSnapshot

expect(
  toMatchInlineSnapshot.call({} as Context, {received: 'value'}),
).type.toEqual<ExpectationResult>();

expect(
  toMatchInlineSnapshot.call(
    {} as Context,
    {received: 'value'},
    'inlineSnapshot',
  ),
).type.toEqual<ExpectationResult>();

expect(
  toMatchInlineSnapshot.call(
    {} as Context,
    {received: 'value'},
    {property: 'match'},
  ),
).type.toEqual<ExpectationResult>();

expect(
  toMatchInlineSnapshot.call(
    {} as Context,
    {received: 'value'},
    {property: 'match'},
    'inlineSnapshot',
  ),
).type.toEqual<ExpectationResult>();

expect(toMatchInlineSnapshot({received: 'value'})).type.toRaiseError();

// toThrowErrorMatchingSnapshot

expect(
  toThrowErrorMatchingSnapshot.call({} as Context, new Error('received')),
).type.toEqual<ExpectationResult>();

expect(
  toThrowErrorMatchingSnapshot.call(
    {} as Context,
    new Error('received'),
    'someHint',
  ),
).type.toEqual<ExpectationResult>();

expect(
  toThrowErrorMatchingSnapshot.call(
    {} as Context,
    new Error('received'),
    'someHint',
    true, // fromPromise
  ),
).type.toEqual<ExpectationResult>();

expect(
  toThrowErrorMatchingSnapshot.call(
    {} as Context,
    new Error('received'),
    undefined,
    false, // fromPromise
  ),
).type.toEqual<ExpectationResult>();

expect(toThrowErrorMatchingSnapshot({received: 'value'})).type.toRaiseError();

// toThrowErrorMatchingInlineSnapshot

expect(
  toThrowErrorMatchingInlineSnapshot.call({} as Context, new Error('received')),
).type.toEqual<ExpectationResult>();

expect(
  toThrowErrorMatchingInlineSnapshot.call(
    {} as Context,
    new Error('received'),
    'inlineSnapshot',
  ),
).type.toEqual<ExpectationResult>();

expect(
  toThrowErrorMatchingInlineSnapshot.call(
    {} as Context,
    new Error('received'),
    'inlineSnapshot',
    true, // fromPromise
  ),
).type.toEqual<ExpectationResult>();

expect(
  toThrowErrorMatchingInlineSnapshot.call(
    {} as Context,
    new Error('received'),
    undefined,
    false, // fromPromise
  ),
).type.toEqual<ExpectationResult>();

expect(
  toThrowErrorMatchingInlineSnapshot({received: 'value'}),
).type.toRaiseError();
