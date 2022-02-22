/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
import {jest} from '@jest/globals';
import type {Mock, SpyInstance} from 'jest-mock';

expectType<typeof jest>(
  jest
    .autoMockOff()
    .autoMockOn()
    .clearAllMocks()
    .disableAutomock()
    .enableAutomock()
    .deepUnmock('moduleName')
    .doMock('moduleName')
    .doMock('moduleName', jest.fn())
    .doMock('moduleName', jest.fn(), {})
    .doMock('moduleName', jest.fn(), {virtual: true})
    .dontMock('moduleName')
    .isolateModules(() => {})
    .mock('moduleName')
    .mock('moduleName', jest.fn())
    .mock('moduleName', jest.fn(), {})
    .mock('moduleName', jest.fn(), {virtual: true})
    .unstable_mockModule('moduleName', jest.fn())
    .unstable_mockModule('moduleName', () => Promise.resolve(jest.fn()))
    .unstable_mockModule('moduleName', jest.fn(), {})
    .unstable_mockModule('moduleName', () => Promise.resolve(jest.fn()), {})
    .unstable_mockModule('moduleName', jest.fn(), {virtual: true})
    .unstable_mockModule('moduleName', () => Promise.resolve(jest.fn()), {
      virtual: true,
    })
    .resetAllMocks()
    .resetModules()
    .restoreAllMocks()
    .retryTimes(3)
    .setMock('moduleName', {a: 'b'})
    .setTimeout(6000)
    .unmock('moduleName')
    .useFakeTimers()
    .useFakeTimers('modern')
    .useFakeTimers('legacy')
    .useRealTimers(),
);

expectType<typeof jest>(jest.autoMockOff());
expectError(jest.autoMockOff(true));

expectType<typeof jest>(jest.autoMockOn());
expectError(jest.autoMockOn(false));

expectType<unknown>(jest.createMockFromModule('moduleName'));
expectError(jest.createMockFromModule());

expectType<typeof jest>(jest.deepUnmock('moduleName'));
expectError(jest.deepUnmock());

expectType<typeof jest>(jest.doMock('moduleName'));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn()));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn(), {}));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn(), {virtual: true}));
expectError(jest.doMock());

expectType<typeof jest>(jest.dontMock('moduleName'));
expectError(jest.dontMock());

expectType<typeof jest>(jest.disableAutomock());
expectError(jest.disableAutomock(true));

expectType<typeof jest>(jest.enableAutomock());
expectError(jest.enableAutomock('moduleName'));

expectType<typeof jest>(jest.isolateModules(() => {}));
expectError(jest.isolateModules());

expectType<typeof jest>(jest.mock('moduleName'));
expectType<typeof jest>(jest.mock('moduleName', jest.fn()));
expectType<typeof jest>(jest.mock('moduleName', jest.fn(), {}));
expectType<typeof jest>(jest.mock('moduleName', jest.fn(), {virtual: true}));
expectError(jest.mock());

expectType<typeof jest>(jest.unstable_mockModule('moduleName', jest.fn()));
expectType<typeof jest>(
  jest.unstable_mockModule('moduleName', () => Promise.resolve(jest.fn())),
);
expectType<typeof jest>(jest.unstable_mockModule('moduleName', jest.fn(), {}));
expectType<typeof jest>(
  jest.unstable_mockModule('moduleName', () => Promise.resolve(jest.fn()), {}),
);
expectType<typeof jest>(
  jest.unstable_mockModule('moduleName', jest.fn(), {virtual: true}),
);
expectType<typeof jest>(
  jest.unstable_mockModule('moduleName', () => Promise.resolve(jest.fn()), {
    virtual: true,
  }),
);

expectType<unknown>(jest.requireActual('./pathToModule'));
expectError(jest.requireActual());

expectType<unknown>(jest.requireMock('./pathToModule'));
expectError(jest.requireMock());

expectType<typeof jest>(jest.resetModules());
expectError(jest.resetModules('moduleName'));

expectType<typeof jest>(jest.setMock('moduleName', {a: 'b'}));
expectError(jest.setMock('moduleName'));

expectType<typeof jest>(jest.unmock('moduleName'));
expectError(jest.unmock());

// Mock Functions

expectType<typeof jest>(jest.clearAllMocks());
expectError(jest.clearAllMocks('moduleName'));

expectType<boolean>(jest.isMockFunction(() => {}));
expectError(jest.isMockFunction());

const maybeMock = (a: string, b: number) => true;

if (jest.isMockFunction(maybeMock)) {
  expectType<Mock<boolean, [a: string, b: number]>>(maybeMock);

  maybeMock.mockReturnValueOnce(false);
  expectError(maybeMock.mockReturnValueOnce(123));
}

if (!jest.isMockFunction(maybeMock)) {
  expectType<(a: string, b: number) => boolean>(maybeMock);
}

const surelyMock = jest.fn((a: string, b: number) => true);

if (jest.isMockFunction(surelyMock)) {
  expectType<Mock<boolean, [a: string, b: number]>>(surelyMock);

  surelyMock.mockReturnValueOnce(false);
  expectError(surelyMock.mockReturnValueOnce(123));
}

if (!jest.isMockFunction(surelyMock)) {
  expectType<never>(surelyMock);
}

declare const stringMaybeMock: string;

if (!jest.isMockFunction(stringMaybeMock)) {
  expectType<string>(stringMaybeMock);
}

if (jest.isMockFunction(stringMaybeMock)) {
  expectType<string & Mock<unknown, Array<unknown>>>(stringMaybeMock);
}

declare const anyMaybeMock: any;

if (!jest.isMockFunction(anyMaybeMock)) {
  expectType<any>(anyMaybeMock);
}

if (jest.isMockFunction(anyMaybeMock)) {
  expectType<Mock<unknown, Array<unknown>>>(anyMaybeMock);
}

declare const unknownMaybeMock: unknown;

if (!jest.isMockFunction(unknownMaybeMock)) {
  expectType<unknown>(unknownMaybeMock);
}

if (jest.isMockFunction(unknownMaybeMock)) {
  expectType<Mock<unknown, Array<unknown>>>(unknownMaybeMock);
}

expectType<Mock<unknown>>(jest.fn());
expectType<Mock<void, []>>(jest.fn(() => {}));
expectType<Mock<boolean, [a: string, b: number]>>(
  jest.fn((a: string, b: number) => true),
);
expectType<Mock<never, [e: any]>>(
  jest.fn((e: any) => {
    throw new Error();
  }),
);
expectError(jest.fn('moduleName'));

expectType<typeof jest>(jest.resetAllMocks());
expectError(jest.resetAllMocks(true));

expectType<typeof jest>(jest.restoreAllMocks());
expectError(jest.restoreAllMocks(false));

const spiedArray = ['a', 'b'];

const spiedFunction = () => {};

spiedFunction.toString();

const spiedObject = {
  _propertyB: false,

  methodA() {
    return true;
  },
  methodB(a: string, b: number) {
    return;
  },
  methodC(e: any) {
    throw new Error();
  },

  propertyA: 'abc',

  set propertyB(value) {
    this._propertyB = value;
  },
  get propertyB() {
    return this._propertyB;
  },
};

expectType<SpyInstance<boolean, []>>(jest.spyOn(spiedObject, 'methodA'));
expectType<SpyInstance<void, [a: string, b: number]>>(
  jest.spyOn(spiedObject, 'methodB'),
);
expectType<SpyInstance<never, [e: any]>>(jest.spyOn(spiedObject, 'methodC'));

expectType<SpyInstance<boolean, []>>(
  jest.spyOn(spiedObject, 'propertyB', 'get'),
);
expectType<SpyInstance<void, [boolean]>>(
  jest.spyOn(spiedObject, 'propertyB', 'set'),
);
expectError(jest.spyOn(spiedObject, 'propertyB'));
expectError(jest.spyOn(spiedObject, 'methodB', 'get'));
expectError(jest.spyOn(spiedObject, 'methodB', 'set'));

expectType<SpyInstance<string, []>>(
  jest.spyOn(spiedObject, 'propertyA', 'get'),
);
expectType<SpyInstance<void, [string]>>(
  jest.spyOn(spiedObject, 'propertyA', 'set'),
);
expectError(jest.spyOn(spiedObject, 'propertyA'));

expectError(jest.spyOn(spiedObject, 'notThere'));
expectError(jest.spyOn('abc', 'methodA'));
expectError(jest.spyOn(123, 'methodA'));
expectError(jest.spyOn(true, 'methodA'));
expectError(jest.spyOn(spiedObject));
expectError(jest.spyOn());

expectType<SpyInstance<boolean, [arg: any]>>(
  jest.spyOn(spiedArray as unknown as ArrayConstructor, 'isArray'),
);
expectError(jest.spyOn(spiedArray, 'isArray'));

expectType<SpyInstance<string, []>>(
  jest.spyOn(spiedFunction as unknown as Function, 'toString'), // eslint-disable-line @typescript-eslint/ban-types
);
expectError(jest.spyOn(spiedFunction, 'toString'));

expectType<SpyInstance<Date, [value: string | number | Date]>>(
  jest.spyOn(globalThis, 'Date'),
);
expectType<SpyInstance<number, []>>(jest.spyOn(Date, 'now'));

// Mock Timers

expectType<void>(jest.advanceTimersByTime(6000));
expectError(jest.advanceTimersByTime());

expectType<void>(jest.advanceTimersToNextTimer());
expectType<void>(jest.advanceTimersToNextTimer(2));
expectError(jest.advanceTimersToNextTimer('2'));

expectType<void>(jest.clearAllTimers());
expectError(jest.clearAllTimers(false));

expectType<number>(jest.getTimerCount());
expectError(jest.getTimerCount(true));

expectType<number>(jest.getRealSystemTime());
expectError(jest.getRealSystemTime(true));

expectType<void>(jest.runAllImmediates());
expectError(jest.runAllImmediates(true));

expectType<void>(jest.runAllTicks());
expectError(jest.runAllTicks(true));

expectType<void>(jest.runAllTimers());
expectError(jest.runAllTimers(false));

expectType<void>(jest.runOnlyPendingTimers());
expectError(jest.runOnlyPendingTimers(true));

expectType<void>(jest.setSystemTime());
expectType<void>(jest.setSystemTime(1483228800000));
expectType<void>(jest.setSystemTime(Date.now()));
expectType<void>(jest.setSystemTime(new Date(1995, 11, 17)));
expectError(jest.setSystemTime('1995-12-17T03:24:00'));

expectType<typeof jest>(jest.useFakeTimers());
expectType<typeof jest>(jest.useFakeTimers('modern'));
expectType<typeof jest>(jest.useFakeTimers('legacy'));
expectError(jest.useFakeTimers('latest'));

expectType<typeof jest>(jest.useRealTimers());
expectError(jest.useRealTimers(true));

// Misc

expectType<typeof jest>(jest.setTimeout(6000));
expectError(jest.setTimeout());

expectType<typeof jest>(jest.retryTimes(3));
expectError(jest.retryTimes());
