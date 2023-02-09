// Copyright (c) Meta Platforms, Inc. and affiliates.

import {describe, expect, it, jest} from '@jest/globals';
import Memory from '../Memory';
import makeCalc from '../calc';
import sub from '../sub';
import sum from '../sum';

jest.mock('../Memory');
jest.mock('../sub');
jest.mock('../sum');

const mockSub = jest.mocked(sub);
const mockSum = jest.mocked(sum);
const MockMemory = jest.mocked(Memory);

describe('calc - mocks', () => {
  const memory = new MockMemory();

  it('returns result from subtract', () => {
    mockSub.mockReturnValueOnce(0);

    const calc = makeCalc(memory);
    const result = calc('Sub', [2, 2]);

    expect(result).toBe(0);
    expect(mockSub).toHaveBeenCalledWith(2, 2);
  });

  it('returns result from sum', () => {
    mockSum.mockReturnValueOnce(2);

    const calc = makeCalc(memory);
    const result = calc('Sum', [1, 1]);

    expect(result).toBe(2);
    expect(mockSum).toHaveBeenCalledWith(1, 1);
  });

  it('adds last result to memory', () => {
    MockMemory.prototype.add.mockImplementationOnce(x => x);
    mockSum.mockReturnValueOnce(2);

    const calc = makeCalc(memory);
    const sumResult = calc('Sum', [1, 1]);
    const memoryResult = calc('MemoryAdd', []);

    expect(sumResult).toBe(2);
    expect(memoryResult).toBe(2);
    expect(MockMemory.prototype.add).toHaveBeenCalledWith(2);
  });

  it('subtracts last result to memory', () => {
    MockMemory.prototype.subtract.mockImplementationOnce(x => x);
    mockSum.mockReturnValueOnce(2);

    const calc = makeCalc(memory);
    const sumResult = calc('Sum', [1, 1]);
    const memoryResult = calc('MemorySub', []);

    expect(sumResult).toBe(2);
    expect(memoryResult).toBe(2);
    expect(MockMemory.prototype.subtract).toHaveBeenCalledWith(2);
  });

  it('clears the memory', () => {
    MockMemory.prototype.add.mockImplementationOnce(x => x);
    mockSum.mockReturnValueOnce(2).mockReturnValueOnce(4);

    const calc = makeCalc(memory);
    const sumResult = calc('Sum', [1, 1]);
    const memoryResult = calc('MemoryAdd', []);
    const sumResult2 = calc('Sum', [2, 2]);
    const clearResult = calc('MemoryClear', []);

    expect(sumResult).toBe(2);
    expect(memoryResult).toBe(2);
    expect(sumResult2).toBe(4);
    expect(clearResult).toBe(4);
    expect(MockMemory.prototype.reset).toHaveBeenCalledTimes(1);
  });

  it('throws an error when invalid Op is passed', () => {
    const calc = makeCalc(memory);

    // @ts-expect-error
    expect(() => calc('Multiply', [2, 3])).toThrow(new Error('Invalid op'));
  });
});
