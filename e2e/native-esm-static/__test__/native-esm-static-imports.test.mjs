import {Buffer} from 'buffer';
import * as fs from 'fs/promises';
import {jest} from '@jest/globals';
import inc from '../../native-esm/stateful.mjs';
import DefaultCalculator, * as calc from '../static-import';
import {NegativeCalculator} from '../static-import';

// eslint-disable-next-line no-var
var mockInc;
const mockSampleData = new Buffer('test-content');

jest.unstable_mockModule('../../native-esm/stateful.mjs', () => {
  mockInc = jest.fn().mockImplementation(() => {
    return 100;
  });

  return {
    default: mockInc,
  };
});

jest.unstable_mockModule('fs/promises', () => {
  return {
    readFile: jest.fn().mockImplementation(() => mockSampleData),
  };
});

it('mocks to be called', () => {
  expect(new DefaultCalculator().inc()).toBe(100);
  expect(inc).toHaveBeenCalled();
  expect(new NegativeCalculator().dec()).toBe(-100);
  expect(inc).toHaveBeenCalledTimes(2);
  expect(new calc.NegativeCalculator().dec()).toBe(-100);
  expect(inc).toHaveBeenCalledTimes(3);
});

it('system module mocked', async () => {
  const buffer = await fs.readFile('test-file');
  expect(buffer.toString()).toBe('test-content');
});
