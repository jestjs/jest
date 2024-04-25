import '../esm-package';
import '../cjs-package';

it('load order is preserved', () =>
  expect(globalThis.Registrar['esm-package']).toEqual({}));
