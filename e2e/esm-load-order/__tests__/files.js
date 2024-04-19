import '../pure-esm/file1.js';
import '../pure-esm/file3.js';

it('load order is preserved', () => expect(Registrar['file1']).toEqual({}));
