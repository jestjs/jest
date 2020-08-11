/**
 * @type ./empty.d.ts
 */

import {
  expectType
} from 'tsd';

expectType<void>(it('name', () => {}));
expectType<void>(it('name', async () => {}));
expectType<void>(it('name', () => {}, 9001));
expectType<void>(it('name', async () => {}, 9001));
expectType<void>(it('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(it.only('name', () => {}));
expectType<void>(it.only('name', async () => {}));
expectType<void>(it.only('name', () => {}, 9001));
expectType<void>(it.only('name', async () => {}, 9001));
expectType<void>(it.only('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(it.skip('name', () => {}));
expectType<void>(it.skip('name', async () => {}));
expectType<void>(it.skip('name', () => {}, 9001));
expectType<void>(it.skip('name', async () => {}, 9001));
expectType<void>(it.skip('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(it.todo('name', () => {}));
expectType<void>(it.todo('name', async () => {}));
expectType<void>(it.todo('name', () => {}, 9001));
expectType<void>(it.todo('name', async () => {}, 9001));
expectType<void>(it.todo('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(it.concurrent('name', () => {}));
expectType<void>(it.concurrent('name', async () => {}));
expectType<void>(it.concurrent('name', () => {}, 9001));
expectType<void>(it.concurrent('name', async () => {}, 9001));
expectType<void>(it.concurrent('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(fit('name', () => {}));
expectType<void>(fit('name', async () => {}));
expectType<void>(fit('name', () => {}, 9001));
expectType<void>(fit('name', async () => {}, 9001));
expectType<void>(fit('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(fit.only('name', () => {}));
expectType<void>(fit.only('name', async () => {}));
expectType<void>(fit.only('name', () => {}, 9001));
expectType<void>(fit.only('name', async () => {}, 9001));
expectType<void>(fit.only('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(fit.skip('name', () => {}));
expectType<void>(fit.skip('name', async () => {}));
expectType<void>(fit.skip('name', () => {}, 9001));
expectType<void>(fit.skip('name', async () => {}, 9001));
expectType<void>(fit.skip('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(fit.todo('name', () => {}));
expectType<void>(fit.todo('name', async () => {}));
expectType<void>(fit.todo('name', () => {}, 9001));
expectType<void>(fit.todo('name', async () => {}, 9001));
expectType<void>(fit.todo('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(fit.concurrent('name', () => {}));
expectType<void>(fit.concurrent('name', async () => {}));
expectType<void>(fit.concurrent('name', () => {}, 9001));
expectType<void>(fit.concurrent('name', async () => {}, 9001));
expectType<void>(fit.concurrent('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xit('name', () => {}));
expectType<void>(xit('name', async () => {}));
expectType<void>(xit('name', () => {}, 9001));
expectType<void>(xit('name', async () => {}, 9001));
expectType<void>(xit('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xit.only('name', () => {}));
expectType<void>(xit.only('name', async () => {}));
expectType<void>(xit.only('name', () => {}, 9001));
expectType<void>(xit.only('name', async () => {}, 9001));
expectType<void>(xit.only('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xit.skip('name', () => {}));
expectType<void>(xit.skip('name', async () => {}));
expectType<void>(xit.skip('name', () => {}, 9001));
expectType<void>(xit.skip('name', async () => {}, 9001));
expectType<void>(xit.skip('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xit.todo('name', () => {}));
expectType<void>(xit.todo('name', async () => {}));
expectType<void>(xit.todo('name', () => {}, 9001));
expectType<void>(xit.todo('name', async () => {}, 9001));
expectType<void>(xit.todo('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xit.concurrent('name', () => {}));
expectType<void>(xit.concurrent('name', async () => {}));
expectType<void>(xit.concurrent('name', () => {}, 9001));
expectType<void>(xit.concurrent('name', async () => {}, 9001));
expectType<void>(xit.concurrent('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(test('name', () => {}));
expectType<void>(test('name', async () => {}));
expectType<void>(test('name', () => {}, 9001));
expectType<void>(test('name', async () => {}, 9001));
expectType<void>(test('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(test.only('name', () => {}));
expectType<void>(test.only('name', async () => {}));
expectType<void>(test.only('name', () => {}, 9001));
expectType<void>(test.only('name', async () => {}, 9001));
expectType<void>(test.only('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(test.skip('name', () => {}));
expectType<void>(test.skip('name', async () => {}));
expectType<void>(test.skip('name', () => {}, 9001));
expectType<void>(test.skip('name', async () => {}, 9001));
expectType<void>(test.skip('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(test.todo('name', () => {}));
expectType<void>(test.todo('name', async () => {}));
expectType<void>(test.todo('name', () => {}, 9001));
expectType<void>(test.todo('name', async () => {}, 9001));
expectType<void>(test.todo('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(test.concurrent('name', () => {}));
expectType<void>(test.concurrent('name', async () => {}));
expectType<void>(test.concurrent('name', () => {}, 9001));
expectType<void>(test.concurrent('name', async () => {}, 9001));
expectType<void>(test.concurrent('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xtest('name', () => {}));
expectType<void>(xtest('name', async () => {}));
expectType<void>(xtest('name', () => {}, 9001));
expectType<void>(xtest('name', async () => {}, 9001));
expectType<void>(xtest('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xtest.only('name', () => {}));
expectType<void>(xtest.only('name', async () => {}));
expectType<void>(xtest.only('name', () => {}, 9001));
expectType<void>(xtest.only('name', async () => {}, 9001));
expectType<void>(xtest.only('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xtest.skip('name', () => {}));
expectType<void>(xtest.skip('name', async () => {}));
expectType<void>(xtest.skip('name', () => {}, 9001));
expectType<void>(xtest.skip('name', async () => {}, 9001));
expectType<void>(xtest.skip('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xtest.todo('name', () => {}));
expectType<void>(xtest.todo('name', async () => {}));
expectType<void>(xtest.todo('name', () => {}, 9001));
expectType<void>(xtest.todo('name', async () => {}, 9001));
expectType<void>(xtest.todo('name', (callback: jest.DoneCallback) => {}, 9001));

expectType<void>(xtest.concurrent('name', () => {}));
expectType<void>(xtest.concurrent('name', async () => {}));
expectType<void>(xtest.concurrent('name', () => {}, 9001));
expectType<void>(xtest.concurrent('name', async () => {}, 9001));
expectType<void>(xtest.concurrent('name', (callback: jest.DoneCallback) => {}, 9001));
