import '../esm-package';
import '../cjs-package';

it('load order is preserved', () => expect(Registrar['esm-package']).toEqual({}));
