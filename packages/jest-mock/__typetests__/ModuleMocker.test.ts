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
  expect(exampleMetadata).type.toBe<MockMetadata<
    typeof exampleModule
  > | null>();
});

test('generateFromMetadata', () => {
  const exampleMock = moduleMocker.generateFromMetadata(exampleMetadata!);

  expect(exampleMock).type.toBe<Mocked<typeof exampleModule>>();

  expect(exampleMock.methodA.mock.calls).type.toBe<
    Array<[a: number, b: number]>
  >();
  expect(exampleMock.methodB.mock.calls).type.toBe<
    Array<[a: number, b: number]>
  >();

  expect(exampleMock.instance.memberA).type.toBe<Array<number>>();
  expect(exampleMock.instance.memberB.mock.calls).type.toBe<Array<[]>>();

  expect(exampleMock.propertyA.one).type.toBe<string>();
  expect(exampleMock.propertyA.two.mock.calls).type.toBe<Array<[]>>();
  expect(exampleMock.propertyA.three.nine).type.toBe<number>();
  expect(exampleMock.propertyA.three.ten).type.toBe<Array<number>>();

  expect(exampleMock.propertyB).type.toBe<Array<number>>();
  expect(exampleMock.propertyC).type.toBe<number>();
  expect(exampleMock.propertyD).type.toBe<string>();
  expect(exampleMock.propertyE).type.toBe<boolean>();
  expect(exampleMock.propertyF).type.toBe<symbol>();
});
