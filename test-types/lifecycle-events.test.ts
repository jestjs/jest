/**
 * @type ./empty.d.ts
 */

import {
  expectType
} from 'tsd';

expectType<any>(beforeAll(() => {}));
expectType<any>(beforeAll((done: jest.DoneCallback) => {}));
expectType<any>(beforeAll((done: jest.DoneCallback) => done.fail(), 9001));

expectType<any>(beforeEach(() => {}));
expectType<any>(beforeEach((done: jest.DoneCallback) => {}));
expectType<any>(beforeEach((done: jest.DoneCallback) => done.fail(), 9001));

expectType<any>(afterAll(() => {}));
expectType<any>(afterAll((done: jest.DoneCallback) => {}));
expectType<any>(afterAll((done: jest.DoneCallback) => done.fail(), 9001));

expectType<any>(afterEach(() => {}));
expectType<any>(afterEach((done: jest.DoneCallback) => {}));
expectType<any>(afterEach((done: jest.DoneCallback) => done.fail(), 9001));
