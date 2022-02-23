import Memory from '../memory';
import sub from '../sub';
import sum from '../sum';
import makeCalc from '../calc';

jest.mock('../memory');
jest.mock('../sub');
jest.mock('../sum');

const mockSub = sub as jest.MockedFunction<typeof sub>;
const mockSum = sum as jest.MockedFunction<typeof sum>;
const MockMemory = Memory as jest.MockedClass<typeof Memory>;

describe('calc - mocks', () => {
  const memory = new MockMemory();

  it('returns result from subtract', () => {
    mockSub.mockReturnValueOnce(0);

    const calc = makeCalc(memory);
    const result = calc('Sub', [2, 2]);

    expect(result).toEqual(0);
    expect(mockSub).toBeCalledWith(2, 2);
  });

  it('returns result from sum', () => {
    mockSum.mockReturnValueOnce(2);

    const calc = makeCalc(memory);
    const result = calc('Sum', [1, 1]);

    expect(result).toEqual(2);
    expect(mockSum).toBeCalledWith(1, 1);
  });

  it('adds last result to memory', () => {
    MockMemory.prototype.add.mockImplementationOnce(x => x);
    mockSum.mockReturnValueOnce(2);

    const calc = makeCalc(memory);
    const sumResult = calc('Sum', [1, 1]);
    const memoryResult = calc('MemoryAdd', []);

    expect(sumResult).toEqual(2);
    expect(memoryResult).toEqual(2);
    expect(MockMemory.prototype.add).toBeCalledWith(2);
  });

  it('subtracts last result to memory', () => {
    MockMemory.prototype.subtract.mockImplementationOnce(x => x);
    mockSum.mockReturnValueOnce(2);

    const calc = makeCalc(memory);
    const sumResult = calc('Sum', [1, 1]);
    const memoryResult = calc('MemorySub', []);

    expect(sumResult).toEqual(2);
    expect(memoryResult).toEqual(2);
    expect(MockMemory.prototype.subtract).toBeCalledWith(2);
  });

  it('clears the memory', () => {
    MockMemory.prototype.add.mockImplementationOnce(x => x);
    mockSum.mockReturnValueOnce(2).mockReturnValueOnce(4);

    const calc = makeCalc(memory);
    const sumResult = calc('Sum', [1, 1]);
    const memoryResult = calc('MemoryAdd', []);
    const sumResult2 = calc('Sum', [2, 2]);
    const clearResult = calc('MemoryClear', []);

    expect(sumResult).toEqual(2);
    expect(memoryResult).toEqual(2);
    expect(sumResult2).toEqual(4);
    expect(clearResult).toEqual(4);
    expect(MockMemory.prototype.reset).toBeCalledTimes(1);
  });

  it('throws an error when invalid Op is passed', () => {
    const calc = makeCalc(memory);

    // @ts-expect-error
    expect(() => calc('Multiply', [2, 3])).toThrowError(
      new Error('Invalid op'),
    );
  });
});
