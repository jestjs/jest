/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import {MockMetadata, Mocked, ModuleMocker} from 'jest-mock';

class ExampleClass {
  memberA: Array<number>;

  constructor() {
    this.memberA = [1, 2, 3];
  }
  memberB() {}
}

const exampleModule = {
  instance: new ExampleClass(),

  methodA: function square(a: number, b: number) {
    return a * b;
  },
  methodB: async function asyncSquare(a: number, b: number) {
    const result = (await a) * b;
    return result;
  },

  propertyA: {
    one: 'foo',
    three: {
      nine: 1,
      ten: [1, 2, 3],
    },
    two() {},
  },
  propertyB: [1, 2, 3],
  propertyC: 123,
  propertyD: 'baz',
  propertyE: true,
  propertyF: Symbol.for('a.b.c'),
};

const moduleMocker = new ModuleMocker(globalThis);

// getMetadata

const exampleMetadata = moduleMocker.getMetadata(exampleModule);

expectType<MockMetadata<typeof exampleModule> | null>(exampleMetadata);

// generateFromMetadata

const exampleMock = moduleMocker.generateFromMetadata(exampleMetadata!);

expectType<Mocked<typeof exampleModule>>(exampleMock);

expectType<Array<[a: number, b: number]>>(exampleMock.methodA.mock.calls);
expectType<Array<[a: number, b: number]>>(exampleMock.methodB.mock.calls);

expectType<Array<number>>(exampleMock.instance.memberA);
expectType<Array<[]>>(exampleMock.instance.memberB.mock.calls);

expectType<string>(exampleMock.propertyA.one);
expectType<Array<[]>>(exampleMock.propertyA.two.mock.calls);
expectType<number>(exampleMock.propertyA.three.nine);
expectType<Array<number>>(exampleMock.propertyA.three.ten);

expectType<Array<number>>(exampleMock.propertyB);
expectType<number>(exampleMock.propertyC);
expectType<string>(exampleMock.propertyD);
expectType<boolean>(exampleMock.propertyE);
expectType<symbol>(exampleMock.propertyF);
