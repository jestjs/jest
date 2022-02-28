/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import {mocked} from 'jest-mock';

const foo = {
  a: {
    b: {
      c: {
        hello: (name: string): string => `Hello, ${name}`,
      },
    },
  },
};

const mockedFoo = mocked(foo);

expectType<string>(mockedFoo.a.b.c.hello('me'));

expectType<Array<[name: string]>>(mockedFoo.a.b.c.hello.mock.calls);
