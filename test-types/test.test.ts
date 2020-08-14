/**
 * @type ./empty.d.ts
 */

import {expectType} from 'tsd';
import {test, xtest} from '@jest/globals';
import type {DoneFn} from '@jest/types/src/Global';

expectType<void>(test('name', () => {}));
expectType<void>(test('name', async () => {}));
expectType<void>(test('name', () => {}, 9001));
expectType<void>(test('name', async () => {}, 9001));
expectType<void>(
  test('name', callback => {
    expectType<DoneFn | undefined>(callback);
  }, 9001),
);

expectType<void>(test.only('name', () => {}));
expectType<void>(test.only('name', async () => {}));
expectType<void>(test.only('name', () => {}, 9001));
expectType<void>(test.only('name', async () => {}, 9001));
expectType<void>(
  test.only('name', callback => {
    expectType<DoneFn | undefined>(callback);
  }, 9001),
);

expectType<void>(test.skip('name', () => {}));
expectType<void>(test.skip('name', async () => {}));
expectType<void>(test.skip('name', () => {}, 9001));
expectType<void>(test.skip('name', async () => {}, 9001));
expectType<void>(
  test.skip('name', callback => {
    expectType<DoneFn | undefined>(callback);
  }, 9001),
);

expectType<void>(test.todo('name', () => {}));
expectType<void>(test.todo('name', async () => {}));
expectType<void>(test.todo('name', () => {}, 9001));
expectType<void>(test.todo('name', async () => {}, 9001));
expectType<void>(
  test.todo(
    'name',
    (callback: DoneFn) => {
      expectType<DoneFn | undefined>(callback);
    },
    9001,
  ),
);

// FIXME
// expectType<void>(test.concurrent('name', () => {}));
// expectType<void>(test.concurrent('name', () => {}, 9001));
expectType<void>(test.concurrent('name', async () => {}));
expectType<void>(test.concurrent('name', async () => {}, 9001));
// FIXME: type '(callback: DoneFn | undefined) => void' is
// not assignable to parameter of type 'ConcurrentTestFn'.
// expectType<void>(
//   test.concurrent(
//     'name',
//     callback => {
//       expectType<DoneFn | undefined>(callback);
//     },
//     9001,
//   ),
// );

expectType<void>(xtest('name', () => {}));
expectType<void>(xtest('name', async () => {}));
expectType<void>(xtest('name', () => {}, 9001));
expectType<void>(xtest('name', async () => {}, 9001));
expectType<void>(
  xtest('name', callback => {
    expectType<DoneFn | undefined>(callback);
  }, 9001),
);

// FIXME: `only()` does not exist in `ItBase` type
// expectType<void>(xtest.only('name', () => {}));
// expectType<void>(xtest.only('name', async () => {}));
// expectType<void>(xtest.only('name', () => {}, 9001));
// expectType<void>(xtest.only('name', async () => {}, 9001));
// expectType<void>(
//   xtest.only('name', (callback: DoneFn) => {
//     expectType<DoneFn | undefined>(callback);
//   }, 9001),
// );

// FIXME: Property 'skip' does not exist on type 'ItBase'
// expectType<void>(xtest.skip('name', () => {}));
// expectType<void>(xtest.skip('name', async () => {}));
// expectType<void>(xtest.skip('name', () => {}, 9001));
// expectType<void>(xtest.skip('name', async () => {}, 9001));
// expectType<void>(
//   xtest.skip('name', (callback: DoneFn) => {
//     expectType<DoneFn | undefined>(callback);
//   }, 9001),
// );

// FIXME: Property 'todo' does not exist on type 'ItBase'
// expectType<void>(xtest.todo('name', () => {}));
// expectType<void>(xtest.todo('name', async () => {}));
// expectType<void>(xtest.todo('name', () => {}, 9001));
// expectType<void>(xtest.todo('name', async () => {}, 9001));
// expectType<void>(
//   xtest.todo(
//     'name',
//     (callback: DoneFn) => {
//       expectType<DoneFn | undefined>(callback);
//     },
//     9001,
//   ),
// );

// FIXME: Property 'concurrent' does not exist on type 'ItBase'
// expectType<void>(xtest.concurrent('name', () => {}));
// expectType<void>(xtest.concurrent('name', async () => {}));
// expectType<void>(xtest.concurrent('name', () => {}, 9001));
// expectType<void>(xtest.concurrent('name', async () => {}, 9001));
// expectType<void>(
//   xtest.concurrent(
//     'name',
//     (callback: DoneFn) => {
//       expectType<DoneFn | undefined>(callback);
//     },
//     9001,
//   ),
// );
