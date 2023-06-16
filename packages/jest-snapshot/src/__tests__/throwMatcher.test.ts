/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Context,
  toThrowErrorMatchingNamedSnapshot,
  toThrowErrorMatchingSnapshot,
} from '../';

const mockedMatch = jest.fn(() => ({
  actual: 'coconut',
  expected: 'coconut',
}));

const mockedContext = {
  snapshotState: {match: mockedMatch},
} as unknown as Context;

afterEach(() => {
  jest.clearAllMocks();
});

describe('throw matcher can take func', () => {
  it('toThrowErrorMatchingSnapshot', () => {
    toThrowErrorMatchingSnapshot.call(
      mockedContext,
      () => {
        throw new Error('coconut');
      },
      undefined,
      false,
    );

    expect(mockedMatch).toHaveBeenCalledTimes(1);
    expect(mockedMatch).toHaveBeenCalledWith(
      expect.objectContaining({received: 'coconut', testName: ''}),
    );
  });

  it('toThrowErrorMatchingNamedSnapshot', () => {
    toThrowErrorMatchingNamedSnapshot.call(
      mockedContext,
      () => {
        throw new Error('coconut');
      },
      '',
      false,
    );

    expect(mockedMatch).toHaveBeenCalledTimes(1);
    expect(mockedMatch).toHaveBeenCalledWith(
      expect.objectContaining({received: 'coconut', testName: ''}),
    );
  });
});

describe('throw matcher from promise', () => {
  describe('toThrowErrorMatchingSnapshot', () => {
    it('can take error', () => {
      toThrowErrorMatchingSnapshot.call(
        mockedContext,
        new Error('coco'),
        'testName',
        true,
      );

      expect(mockedMatch).toHaveBeenCalledTimes(1);
      expect(mockedMatch).toHaveBeenCalledWith(
        expect.objectContaining({received: 'coco', testName: ''}),
      );
    });

    it('can take custom error', () => {
      class CustomError extends Error {}

      toThrowErrorMatchingSnapshot.call(
        mockedContext,
        new CustomError('nut'),
        'testName',
        true,
      );

      expect(mockedMatch).toHaveBeenCalledTimes(1);
      expect(mockedMatch).toHaveBeenCalledWith(
        expect.objectContaining({received: 'nut', testName: ''}),
      );
    });
  });

  describe('toThrowErrorMatchingNamedSnapshot', () => {
    const mockedNamedMatch = jest.fn(() => ({
      actual: 'coconut',
      expected: 'coconut',
      key: 'snapshot name 1',
    }));

    const mockedNamedContext = {
      snapshotState: {match: mockedNamedMatch},
    } as unknown as Context;

    it('can take error', () => {
      toThrowErrorMatchingNamedSnapshot.call(
        mockedNamedContext,
        new Error('coco'),
        'snapshot name',
        true,
      );

      expect(mockedNamedMatch).toHaveBeenCalledTimes(1);
      expect(mockedNamedMatch).toHaveBeenCalledWith(
        expect.objectContaining({received: 'coco', testName: 'snapshot name'}),
      );
    });

    it('can take custom error', () => {
      class CustomError extends Error {}

      toThrowErrorMatchingNamedSnapshot.call(
        mockedNamedContext,
        new CustomError('nut'),
        'snapshot name',
        true,
      );

      expect(mockedNamedMatch).toHaveBeenCalledTimes(1);
      expect(mockedNamedMatch).toHaveBeenCalledWith(
        expect.objectContaining({received: 'nut', testName: 'snapshot name'}),
      );
    });
  });
});
