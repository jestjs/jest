/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import type {Jest} from '@jest/environment';
import type {JestExpect} from '@jest/expect';
import type {Config as ConfigTypes, Global} from '@jest/types';
import type {Config} from 'jest';
import type {
  Mocked,
  MockedClass,
  MockedFunction,
  MockedObject,
} from 'jest-mock';

// Config

declare const config: Config;

expectType<ConfigTypes.InitialOptions>(config);

// globals enabled through "types": ["jest"]

class SomeClass {
  constructor(one: string, two?: boolean) {}

  methodA() {
    return true;
  }
  methodB(a: string, b?: number) {
    return;
  }
}

function someFunction(a: string, b?: number): boolean {
  return true;
}

const someObject = {
  SomeClass,

  methodA() {
    return;
  },
  methodB(b: string) {
    return true;
  },
  methodC: (c: number) => true,

  one: {
    more: {
      time: (t: number) => {
        return;
      },
    },
  },

  propertyA: 123,
  propertyB: 'value',

  someClassInstance: new SomeClass('value'),
};

expectType<Global.TestFrameworkGlobals['beforeEach']>(beforeEach);
expectType<Global.TestFrameworkGlobals['beforeAll']>(beforeAll);

expectType<Global.TestFrameworkGlobals['afterEach']>(afterEach);
expectType<Global.TestFrameworkGlobals['afterAll']>(afterAll);

expectType<Global.TestFrameworkGlobals['describe']>(describe);
expectType<Global.TestFrameworkGlobals['fdescribe']>(fdescribe);
expectType<Global.TestFrameworkGlobals['xdescribe']>(xdescribe);

expectType<Global.TestFrameworkGlobals['test']>(test);
expectType<Global.TestFrameworkGlobals['xtest']>(xtest);

expectType<Global.TestFrameworkGlobals['it']>(it);
expectType<Global.TestFrameworkGlobals['fit']>(fit);
expectType<Global.TestFrameworkGlobals['xit']>(xit);

expectType<JestExpect>(expect);

expectType<Jest>(jest);

expectType<Mocked<typeof someObject>>(
  someObject as jest.Mocked<typeof someObject>,
);

expectType<MockedClass<typeof SomeClass>>(
  SomeClass as jest.MockedClass<typeof SomeClass>,
);

expectType<MockedFunction<typeof someFunction>>(
  someFunction as jest.MockedFunction<typeof someFunction>,
);

expectType<MockedObject<typeof someObject>>(
  someObject as jest.MockedObject<typeof someObject>,
);
