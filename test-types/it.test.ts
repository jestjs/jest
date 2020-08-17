/**
 * @type ./empty.d.ts
 */

import {expectType} from 'mlh-tsd';
import {fit, it, xit} from '@jest/globals';
import type {DoneFn} from '@jest/types/src/Global';

expectType<void>(it('name', () => {}));
expectType<void>(it('name', async () => {}));
expectType<void>(it('name', () => {}, 9001));
expectType<void>(it('name', async () => {}, 9001));
expectType<void>(
  it('name', callback => {
    expectType<DoneFn | undefined>(callback);
  }, 9001),
);

expectType<void>(it.only('name', () => {}));
expectType<void>(it.only('name', async () => {}));
expectType<void>(it.only('name', () => {}, 9001));
expectType<void>(it.only('name', async () => {}, 9001));
expectType<void>(
  it.only('name', callback => {
    expectType<DoneFn | undefined>(callback);
  }, 9001),
);

expectType<void>(it.skip('name', () => {}));
expectType<void>(it.skip('name', async () => {}));
expectType<void>(it.skip('name', () => {}, 9001));
expectType<void>(it.skip('name', async () => {}, 9001));
expectType<void>(
  it.skip('name', callback => {
    expectType<DoneFn | undefined>(callback);
  }, 9001),
);

expectType<void>(it.todo('name', () => {}));
expectType<void>(it.todo('name', async () => {}));
expectType<void>(it.todo('name', () => {}, 9001));
expectType<void>(it.todo('name', async () => {}, 9001));
// FIXME: todo has other types, but we are passing something else
// expectType<void>(
//   it.todo(
//     'name',
//     callback => {
//       expectType<DoneFn | undefined>(callback);
//     },
//     9001,
//   ),
// );

// FIXME: Argument of type '() => void' is not assignable to
// parameter of type 'ConcurrentTestFn'.
// expectType<void>(it.concurrent('name', () => {}));
// expectType<void>(it.concurrent('name', () => {}, 9001));
expectType<void>(it.concurrent('name', async () => {}));
expectType<void>(it.concurrent('name', async () => {}, 9001));
// FIXME: SAME PROBLEMMMM!!
// expectType<void>(
//   it.concurrent(
//     'name',
//     callback => {
//       expectType<jest.DoneCallback>(callback);
//     },
//     9001,
//   ),
// );

expectType<void>(fit('name', () => {}));
expectType<void>(fit('name', async () => {}));
expectType<void>(fit('name', () => {}, 9001));
expectType<void>(fit('name', async () => {}, 9001));
expectType<void>(
  fit('name', callback => {
    expectType<DoneFn | undefined>(callback);
  }, 9001),
);

// FIXME: `only()` does not exist
// expectType<void>(fit.only('name', () => {}));
// expectType<void>(fit.only('name', async () => {}));
// expectType<void>(fit.only('name', () => {}, 9001));
// expectType<void>(fit.only('name', async () => {}, 9001));
// expectType<void>(
//   fit.only('name', callback => {
//     expectType<jest.DoneCallback>(callback);
//   }, 9001),
// );

// FIXME: `skip()` does not exist
// expectType<void>(fit.skip('name', () => {}));
// expectType<void>(fit.skip('name', async () => {}));
// expectType<void>(fit.skip('name', () => {}, 9001));
// expectType<void>(fit.skip('name', async () => {}, 9001));
// expectType<void>(
//   fit.skip('name', callback => {
//     expectType<jest.DoneCallback>(callback);
//   }, 9001),
// );

// FIXME: `todo` does not exist
// expectType<void>(fit.todo('name', () => {}));
// expectType<void>(fit.todo('name', async () => {}));
// expectType<void>(fit.todo('name', () => {}, 9001));
// expectType<void>(fit.todo('name', async () => {}, 9001));
// expectType<void>(
//   fit.todo(
//     'name',
//     callback => {
//       expectType<jest.DoneCallback>(callback);
//     },
//     9001,
//   ),
// );

// FIXME: Cannot invoke an object which is possibly 'undefined'.
// expectType<void>(fit.concurrent('name', () => {}));
// expectType<void>(fit.concurrent('name', async () => {}));
// expectType<void>(fit.concurrent('name', () => {}, 9001));
// expectType<void>(fit.concurrent('name', async () => {}, 9001));
// FIXME: Different error. But I am just done already writing those out
// expectType<void>(
//   fit.concurrent(
//     'name',
//     callback => {
//       expectType<DoneFn | undefined>(callback);
//     },
//     9001,
//   ),
// );

expectType<void>(xit('name', () => {}));
expectType<void>(xit('name', async () => {}));
expectType<void>(xit('name', () => {}, 9001));
expectType<void>(xit('name', async () => {}, 9001));
// FIXME: Argument of type '(callback: DoneFn) => void' is not assignable to parameter of type 'TestFn'.
// expectType<void>(
//   xit('name', (callback: DoneFn) => {
//     expectType<DoneFn | undefined>(callback);
//   }, 9001),
// );

// FIXME: only does not exist
// expectType<void>(xit.only('name', () => {}));
// expectType<void>(xit.only('name', async () => {}));
// expectType<void>(xit.only('name', () => {}, 9001));
// expectType<void>(xit.only('name', async () => {}, 9001));
// expectType<void>(
//   xit.only('name', (callback: DoneFn) => {
//     expectType<DoneFn | undefined>(callback);
//   }, 9001),
// );

// FIXME: skip does not exist
// expectType<void>(xit.skip('name', () => {}));
// expectType<void>(xit.skip('name', async () => {}));
// expectType<void>(xit.skip('name', () => {}, 9001));
// expectType<void>(xit.skip('name', async () => {}, 9001));
// expectType<void>(
//   xit.skip('name', (callback: DoneFn) => {
//     expectType<DoneFn | undefined>(callback);
//   }, 9001),
// );

// FIXME: todo does not exist
// expectType<void>(xit.todo('name', () => {}));
// expectType<void>(xit.todo('name', async () => {}));
// expectType<void>(xit.todo('name', () => {}, 9001));
// expectType<void>(xit.todo('name', async () => {}, 9001));
// expectType<void>(
//   xit.todo(
//     'name',
//     (callback: DoneFn) => {
//       expectType<DoneFn | undefined>(callback);
//     },
//     9001,
//   ),
// );

// FIXME: concurrent does not exist
// expectType<void>(xit.concurrent('name', () => {}));
// expectType<void>(xit.concurrent('name', async () => {}));
// expectType<void>(xit.concurrent('name', () => {}, 9001));
// expectType<void>(xit.concurrent('name', async () => {}, 9001));
// expectType<void>(
//   xit.concurrent(
//     'name',
//     (callback: DoneFn) => {
//       expectType<DoneFn | undefined>(callback);
//     },
//     9001,
//   ),
// );
