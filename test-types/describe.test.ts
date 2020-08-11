/**
 * @type ./empty.d.ts
 */

import {
    expectType
} from 'tsd';

expectType<void>(describe(0, () => {}));
expectType<void>(describe('name', () => {}));
expectType<void>(describe(() => {}, () => {}));
expectType<void>(describe({ name: 'name' }, () => {}));

expectType<void>(describe.only(0, () => {}));
expectType<void>(describe.only('name', () => {}));
expectType<void>(describe.only(() => {}, () => {}));
expectType<void>(describe.only({ name: 'name' }, () => {}));

expectType<void>(describe.skip(0, () => {}));
expectType<void>(describe.skip('name', () => {}));
expectType<void>(describe.skip(() => {}, () => {}));
expectType<void>(describe.skip({ name: 'name' }, () => {}));

expectType<void>(fdescribe(0, () => {}));
expectType<void>(fdescribe('name', () => {}));
expectType<void>(fdescribe(() => {}, () => {}));
expectType<void>(fdescribe({ name: 'name' }, () => {}));

expectType<void>(fdescribe.only(0, () => {}));
expectType<void>(fdescribe.only('name', () => {}));
expectType<void>(fdescribe.only(() => {}, () => {}));
expectType<void>(fdescribe.only({ name: 'name' }, () => {}));

expectType<void>(fdescribe.skip(0, () => {}));
expectType<void>(fdescribe.skip('name', () => {}));
expectType<void>(fdescribe.skip(() => {}, () => {}));
expectType<void>(fdescribe.skip({ name: 'name' }, () => {}));

expectType<void>(xdescribe(0, () => {}));
expectType<void>(xdescribe('name', () => {}));
expectType<void>(xdescribe(() => {}, () => {}));
expectType<void>(xdescribe({ name: 'name' }, () => {}));

expectType<void>(xdescribe.only(0, () => {}));
expectType<void>(xdescribe.only('name', () => {}));
expectType<void>(xdescribe.only(() => {}, () => {}));
expectType<void>(xdescribe.only({ name: 'name' }, () => {}));

expectType<void>(xdescribe.skip(0, () => {}));
expectType<void>(xdescribe.skip('name', () => {}));
expectType<void>(xdescribe.skip(() => {}, () => {}));
expectType<void>(xdescribe.skip({ name: 'name' }, () => {}));
