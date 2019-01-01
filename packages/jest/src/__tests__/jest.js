// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import jest from '../jest';

const sum = (a, b) => a + b;

describe('jest es6 import', () => {
  jest.describe('jest.describe', () => {
    jest.test('should work like global describe', () => {
      jest.expect(sum(1, 2)).toBe(3);
    });
  });

  jest.xdescribe('jest.xdescribe', () => {
    jest.test('should be skipped just like global describe.skip', () => {
      jest.expect(sum(1, 2)).toBe(3);
    });
  });
});
