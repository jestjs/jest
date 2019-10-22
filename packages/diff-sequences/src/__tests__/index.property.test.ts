import fc from 'fast-check';
import diff from '../';

const findCommonItems = (a: Array<string>, b: Array<string>): Array<string> => {
  const array: Array<string> = [];
  diff(
    a.length,
    b.length,
    (aIndex: number, bIndex: number) => a[aIndex] === b[bIndex],
    (nCommon: number, aCommon: number) => {
      for (; nCommon !== 0; nCommon -= 1, aCommon += 1) {
        array.push(a[aCommon]);
      }
    },
  );
  return array;
};

const flatten = (data: Array<Array<string>>) => {
  const array: Array<string> = [];
  for (const items of data) {
    array.push(...items);
  }
  return array;
};

it('should be reflexive', () => {
  fc.assert(
    fc.property(fc.array(fc.char()), a => {
      expect(findCommonItems(a, a)).toEqual(a);
    }),
  );
});

it('should find the same number of common items when switching the inputs', () => {
  // findCommonItems is not symmetric as:
  // > findCommonItems(["Z"," "], [" ","Z"]) = [" "]
  // > findCommonItems([" ","Z"], ["Z"," "]) = ["Z"]
  fc.assert(
    fc.property(fc.array(fc.char()), fc.array(fc.char()), (a, b) => {
      const commonItems = findCommonItems(a, b);
      const symmetricCommonItems = findCommonItems(b, a);
      expect(symmetricCommonItems).toHaveLength(commonItems.length);
    }),
  );
});

it('should have at most the length of its inputs', () => {
  fc.assert(
    fc.property(fc.array(fc.char()), fc.array(fc.char()), (a, b) => {
      const commonItems = findCommonItems(a, b);
      expect(commonItems.length).toBeLessThanOrEqual(a.length);
      expect(commonItems.length).toBeLessThanOrEqual(b.length);
    }),
  );
});

it('should be no-op when passing common items', () => {
  fc.assert(
    fc.property(fc.array(fc.char()), fc.array(fc.char()), (a, b) => {
      const commonItems = findCommonItems(a, b);
      expect(findCommonItems(a, commonItems)).toEqual(commonItems);
      expect(findCommonItems(commonItems, a)).toEqual(commonItems);
    }),
  );
});

it('should find the exact common items when one array is subarray of the other', () => {
  fc.assert(
    fc.property(fc.array(fc.array(fc.char())), data => {
      const allData = flatten(data); // [...data[0], ...data[1], ...data[2], ...data[3], ...]
      const partialData = flatten(data.filter((_, i) => i % 2 === 1)); // [...data[1], ...data[3], ...]
      const commonItems = findCommonItems(allData, partialData);
      // We have:
      // 1. commonItems contains at least all the items of partialData as they are in allData too
      // 2. commonItems cannot contain more items than its inputs (partialData for instance)
      expect(commonItems.length).toBeGreaterThanOrEqual(partialData.length);
    }),
  );
});
