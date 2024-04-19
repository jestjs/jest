import '../mixed-package/file1.js';
import '../pure-esm/file3.js';

it('load order is preserved', () =>
  expect(globalThis.Registrar['file1']).toEqual({})
);
