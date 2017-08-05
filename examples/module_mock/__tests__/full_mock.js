// Copyright 2004-present Facebook. All Rights Reserved.

import DefaultExport, {apple, strawberry} from '../fruit';

/**
 * This file illustrates a full mock of a module.
 */
jest.mock('../fruit');

describe('test', () => {
  it('calls', () => {
    expect(DefaultExport()).toBe(undefined);
    expect(apple).toBe('apple');
    expect(strawberry()).toBe(undefined);
  });
});
