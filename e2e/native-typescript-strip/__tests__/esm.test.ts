import {expect, test} from '@jest/globals';
import {double} from '../double.mts';

test('strips types from an ESM test file', () => {
  const value: number = double(21);
  expect(value).toBe(42);
});
