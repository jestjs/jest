// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * This file illustrates how to do a partial mock where a subset
 * of a module's exports have been mocked and the rest
 * keep their actual implementation.
 */
import DefaultExport, {apple, strawberry} from '../fruit';

jest.mock('../fruit', () => {
  const originalModule = require.requireActual('../fruit');

  const mockedModule = jest.genMockFromModule('../fruit');

  const module = Object.assign(mockedModule, originalModule);

  // Module the default export and named export 'apple'
  module.default = jest.fn(() => 'mocked fruit');
  module.apple = 'mocked apple';
  return module;
});

describe('test', () => {
  it('calls', () => {
    expect(DefaultExport()).toBe('mocked fruit');
    expect(apple).toBe('mocked apple');
    expect(strawberry()).toBe('strawberry');
    expect(DefaultExport).toHaveBeenCalled();
  });
});
