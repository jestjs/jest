/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  initializeGarbageCollectionUtils,
  protectProperties,
} from '../garbage-collection-utils';

const omit = require('lodash').omit;

it('protection symbol doesnt leak', () => {
  const obj = {a: 1, b: 2};
  protectProperties(obj);
  expect(obj).toStrictEqual(obj);
  expect(omit(obj, 'a')).toStrictEqual({b: 2});
  expect({b: 2}).toStrictEqual(omit(obj, 'a'));
});

describe('initializeGarbageCollectionUtils', () => {
  let globalObject: typeof globalThis;
  let warn: jest.Spied<typeof console.warn>;

  beforeEach(() => {
    globalObject = {} as typeof globalThis;
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('defaults to soft when no mode is given', () => {
    expect(initializeGarbageCollectionUtils(globalObject)).toBe('soft');
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps the initialized mode when no mode is given', () => {
    initializeGarbageCollectionUtils(globalObject, 'on');

    expect(initializeGarbageCollectionUtils(globalObject)).toBe('on');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn when the same mode is given again', () => {
    initializeGarbageCollectionUtils(globalObject, 'on');

    expect(initializeGarbageCollectionUtils(globalObject, 'on')).toBe('on');
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and keeps the initialized mode when a different mode is given', () => {
    initializeGarbageCollectionUtils(globalObject, 'on');

    expect(initializeGarbageCollectionUtils(globalObject, 'soft')).toBe('on');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(
      'garbage collection deletion mode already initialized',
    );
  });
});
