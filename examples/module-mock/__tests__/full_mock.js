// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

import defaultExport, {apple, strawberry} from '../fruit';

/**
 * This file illustrates a full mock of a module.
 */
jest.mock('../fruit');

it('does a full mock', () => {
  expect(defaultExport()).toBeUndefined();
  expect(apple).toBe('apple');
  expect(strawberry()).toBeUndefined();
});
