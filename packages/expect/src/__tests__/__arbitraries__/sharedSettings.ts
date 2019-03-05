import fc from 'fast-check';

// settings for anything arbitrary
export const anythingSettings = {
  key: fc.oneof(fc.string(), fc.constantFrom('k1', 'k2', 'k3')),
  withBoxedValues: true,
  // Issue #7975 have to be fixed before enabling the generation of Map
  withMap: false,
  // Issue #7975 have to be fixed before enabling the generation of Set
  withSet: false,
};

// assertion settings
export const assertSettings = {}; // eg.: {numRuns: 10000}
