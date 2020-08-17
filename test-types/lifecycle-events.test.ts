/**
 * @type ./empty.d.ts
 */

import {expectType} from 'mlh-tsd';

expectType<any>(beforeAll(() => {}));
expectType<any>(
  beforeAll(done => {
    expectType<jest.DoneCallback>(done);
  }),
);
expectType<any>(
  beforeAll(done => {
    expectType<jest.DoneCallback>(done);
    expectType<any>(done.fail());
  }, 9001),
);

expectType<any>(beforeEach(() => {}));
expectType<any>(
  beforeEach(done => {
    expectType<jest.DoneCallback>(done);
  }),
);
expectType<any>(
  beforeEach(done => {
    expectType<jest.DoneCallback>(done);
    expectType<any>(done.fail());
  }, 9001),
);

expectType<any>(afterAll(() => {}));
expectType<any>(
  afterAll(done => {
    expectType<jest.DoneCallback>(done);
  }),
);
expectType<any>(
  afterAll(done => {
    expectType<jest.DoneCallback>(done);
    expectType<any>(done.fail());
  }, 9001),
);

expectType<any>(afterEach(() => {}));
expectType<any>(
  afterEach(done => {
    expectType<jest.DoneCallback>(done);
  }),
);
expectType<any>(
  afterEach(done => {
    expectType<jest.DoneCallback>(done);
    expectType<any>(done.fail());
  }, 9001),
);
