import diff from '../';
import fc from 'fast-check'

const findCommonItems = (a: string[], b: string[]): string[] => {
  const array: string[] = [];
  diff(
    a.length,
    b.length,
    (aIndex: number, bIndex: number) => a[aIndex] === b[bIndex],
    (nCommon: number, aCommon: number, bCommon: number) => {
      for (; nCommon !== 0; nCommon -= 1, aCommon += 1) {
        array.push(a[aCommon]);
      }
    },
  );
  return array;
};

const flatten = (data: string[][]) => {
  const array: string[] = [];
  for (const items of data) {
    array.push(...items)
  }
  return array;
}

test('should be reflexive', () => {
  fc.assert(fc.property(
    fc.array(fc.char()), 
    (a) => {
      expect(findCommonItems(a, a)).toEqual(a)
    }
  ))
})

test('should find the same number of common items when switching the inputs', () => {
  // findCommonItems is not symmetric as:
  // > findCommonItems(["Z"," "], [" ","Z"]) = [" "]
  // > findCommonItems([" ","Z"], ["Z"," "]) = ["Z"]
  fc.assert(fc.property(
    fc.array(fc.char()), fc.array(fc.char()),
    (a, b) => {
      const commonItems = findCommonItems(a, b);
      const symmetricCommonItems = findCommonItems(b, a);
      expect(symmetricCommonItems).toHaveLength(commonItems.length)
    }
  ))
})

test('should have at most the length of its inputs', () => {
  fc.assert(fc.property(
    fc.array(fc.char()), fc.array(fc.char()),
    (a, b) => {
      const commonItems = findCommonItems(a, b)
      expect(commonItems.length).toBeLessThanOrEqual(a.length);
      expect(commonItems.length).toBeLessThanOrEqual(b.length);
    }
  ))
})

test('should be no-op when passing common items', () => {
  fc.assert(fc.property(
    fc.array(fc.char()), fc.array(fc.char()),
    (a, b) => {
      const commonItems = findCommonItems(a, b)
      expect(findCommonItems(a, commonItems)).toEqual(commonItems)
      expect(findCommonItems(commonItems, a)).toEqual(commonItems)
    }
  ))
})

test('should find at the least the maximal known subset', () => {
  fc.assert(fc.property(
    fc.array(fc.array(fc.char())),
    (data) => {
      const allData = flatten(data); // [...data[0], ...data[1], ...data[2], ...data[3], ...]
      const partialData = flatten(data.filter((_, i) => i % 2 === 1)) // [...data[1], ...data[3], ...]
      const commonItems = findCommonItems(allData, partialData)
      expect(commonItems.length).toBeGreaterThanOrEqual(partialData.length)
    }
  ))
})
