/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from 'tstyche';
import {type MockMetadata, type Mocked, ModuleMocker} from 'jest-mock';

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

const exampleMetadata = moduleMocker.getMetadata(exampleModule);

test('getMetadata', () => {
  expect(exampleMetadata).type.toEqual<MockMetadata<
    typeof exampleModule
  > | null>();
});

test('generateFromMetadata', () => {
  const exampleMock = moduleMocker.generateFromMetadata(exampleMetadata!);

  expect(exampleMock).type.toEqual<Mocked<typeof exampleModule>>();

  expect(exampleMock.methodA.mock.calls).type.toEqual<
    Array<[a: number, b: number]>
  >();
  expect(exampleMock.methodB.mock.calls).type.toEqual<
    Array<[a: number, b: number]>
  >();

  expect(exampleMock.instance.memberA).type.toEqual<Array<number>>();
  expect(exampleMock.instance.memberB.mock.calls).type.toEqual<Array<[]>>();

  expect(exampleMock.propertyA.one).type.toBeString();
  expect(exampleMock.propertyA.two.mock.calls).type.toEqual<Array<[]>>();
  expect(exampleMock.propertyA.three.nine).type.toBeNumber();
  expect(exampleMock.propertyA.three.ten).type.toEqual<Array<number>>();

  expect(exampleMock.propertyB).type.toEqual<Array<number>>();
  expect(exampleMock.propertyC).type.toBeNumber();
  expect(exampleMock.propertyD).type.toBeString();
  expect(exampleMock.propertyE).type.toBeBoolean();
  expect(exampleMock.propertyF).type.toBeSymbol();
});
