/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  packMessage,
  replaceFunctionsWithStringReferences,
  unpackMessage,
} from '../safeMessageTransferring';

describe('replaceFunctionsWithStringReferences', () => {
  it('replaces a function with a string reference', () => {
    function foo() {}

    expect(replaceFunctionsWithStringReferences(foo)).toBe('[Function foo]');
    expect(replaceFunctionsWithStringReferences(() => {})).toBe(
      '[Function anonymous]',
    );
  });

  it('replaces functions nested in objects and arrays', () => {
    const value = {
      fn: function bar() {},
      list: [{deep: () => {}}, () => {}],
      nested: {arrow: () => {}},
    };

    expect(replaceFunctionsWithStringReferences(value)).toEqual({
      fn: '[Function bar]',
      list: [{deep: '[Function deep]'}, '[Function anonymous]'],
      nested: {arrow: '[Function arrow]'},
    });
  });

  it('keeps non function values as they are', () => {
    const value = {
      bigInt: 10n,
      boolean: true,
      empty: null,
      number: 1,
      string: 'foo',
      undef: undefined,
    };

    expect(replaceFunctionsWithStringReferences(value)).toEqual(value);
  });

  it('does not recurse into values serialized as their own type', () => {
    const date = new Date();
    const map = new Map([['key', () => {}]]);
    const regexp = /foo/g;
    const set = new Set([() => {}]);
    const value = {date, map, regexp, set};

    expect(replaceFunctionsWithStringReferences(value)).toEqual(value);
  });

  it('replaces functions of errors created in another realm', () => {
    // jest-runtime sandboxes test files, so the errors they throw are not
    // instances of this realm's `Error` and are serialized as plain objects.
    const error = Object.create(Error.prototype) as Error & {
      handler: () => void;
      message: string;
      name: string;
    };

    error.handler = function doThing() {};
    error.message = 'boom';
    error.name = 'Error';

    expect(replaceFunctionsWithStringReferences(error)).toEqual({
      handler: '[Function doThing]',
      message: 'boom',
      name: 'Error',
    });
  });

  it('does not recurse into errors of this realm', () => {
    const error = new Error('boom');
    (error as Error & {handler: unknown}).handler = () => {};

    expect(replaceFunctionsWithStringReferences(error)).toBe(error);
  });

  it('handles cyclic references', () => {
    const value: Record<string, unknown> = {fn: () => {}};
    value.self = value;

    expect(() => replaceFunctionsWithStringReferences(value)).not.toThrow();
    expect(replaceFunctionsWithStringReferences(value).fn).toBe(
      '[Function fn]',
    );
  });
});

describe('message transferring', () => {
  it('packs and unpacks a message containing functions', () => {
    const message = {
      matcherResult: {
        actual: () => {},
        expected: function bar() {},
        name: 'toBe',
        pass: false,
      },
    };

    expect(unpackMessage(packMessage(message))).toEqual({
      matcherResult: {
        actual: '[Function actual]',
        expected: '[Function bar]',
        name: 'toBe',
        pass: false,
      },
    });
  });

  it('packs and unpacks cyclic messages', () => {
    const message: Record<string, unknown> = {name: 'toBe'};
    message.self = message;

    expect(() => unpackMessage(packMessage(message))).not.toThrow();
  });

  it('returns messages without the transferring marker untouched', () => {
    const message = {foo: 'bar'};

    expect(unpackMessage(message)).toBe(message);
  });
});
