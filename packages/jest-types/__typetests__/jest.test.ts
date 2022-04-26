/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
import {jest} from '@jest/globals';
import type {Mock, ModuleMocker, SpyInstance} from 'jest-mock';

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
    .useFakeTimers({legacyFakeTimers: true})
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

expectType<typeof jest>(jest.retryTimes(3, {logErrorsBeforeRetry: true}));
expectType<typeof jest>(jest.clearAllMocks());
expectError(jest.clearAllMocks('moduleName'));

expectType<typeof jest>(jest.resetAllMocks());
expectError(jest.resetAllMocks(true));

expectType<typeof jest>(jest.restoreAllMocks());
expectError(jest.restoreAllMocks(false));

expectType<boolean>(jest.isMockFunction(() => {}));
expectError(jest.isMockFunction());

const maybeMock = (a: string, b: number) => true;

if (jest.isMockFunction(maybeMock)) {
  expectType<Mock<(a: string, b: number) => boolean>>(maybeMock);

  maybeMock.mockReturnValueOnce(false);
  expectError(maybeMock.mockReturnValueOnce(123));
}

if (!jest.isMockFunction(maybeMock)) {
  expectType<(a: string, b: number) => boolean>(maybeMock);
}

const surelyMock = jest.fn((a: string, b: number) => true);

if (jest.isMockFunction(surelyMock)) {
  expectType<Mock<(a: string, b: number) => boolean>>(surelyMock);

  surelyMock.mockReturnValueOnce(false);
  expectError(surelyMock.mockReturnValueOnce(123));
}

if (!jest.isMockFunction(surelyMock)) {
  expectType<never>(surelyMock);
}

const spiedObject = {
  methodA(a: number, b: string) {
    return true;
  },
};

const surelySpy = jest.spyOn(spiedObject, 'methodA');

if (jest.isMockFunction(surelySpy)) {
  expectType<SpyInstance<(a: number, b: string) => boolean>>(surelySpy);

  surelySpy.mockReturnValueOnce(false);
  expectError(surelyMock.mockReturnValueOnce(123));
}

if (!jest.isMockFunction(surelySpy)) {
  expectType<never>(surelySpy);
}

declare const stringMaybeMock: string;

if (jest.isMockFunction(stringMaybeMock)) {
  expectType<string & Mock<(...args: Array<unknown>) => unknown>>(
    stringMaybeMock,
  );
}

if (!jest.isMockFunction(stringMaybeMock)) {
  expectType<string>(stringMaybeMock);
}

declare const anyMaybeMock: any;

if (jest.isMockFunction(anyMaybeMock)) {
  expectType<Mock<(...args: Array<unknown>) => unknown>>(anyMaybeMock);
}

if (!jest.isMockFunction(anyMaybeMock)) {
  expectType<any>(anyMaybeMock);
}

declare const unknownMaybeMock: unknown;

if (jest.isMockFunction(unknownMaybeMock)) {
  expectType<Mock<(...args: Array<unknown>) => unknown>>(unknownMaybeMock);
}

if (!jest.isMockFunction(unknownMaybeMock)) {
  expectType<unknown>(unknownMaybeMock);
}

expectType<ModuleMocker['fn']>(jest.fn);

expectType<ModuleMocker['spyOn']>(jest.spyOn);

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

expectType<typeof jest>(jest.useFakeTimers({advanceTimers: true}));
expectType<typeof jest>(jest.useFakeTimers({advanceTimers: 10}));
expectError(jest.useFakeTimers({advanceTimers: 'fast'}));

expectType<typeof jest>(jest.useFakeTimers({doNotFake: ['Date']}));
expectType<typeof jest>(
  jest.useFakeTimers({
    doNotFake: [
      'Date',
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  }),
);
expectError(jest.useFakeTimers({doNotFake: ['globalThis']}));

expectType<typeof jest>(jest.useFakeTimers({legacyFakeTimers: true}));
expectError(jest.useFakeTimers({legacyFakeTimers: 1000}));
expectError(jest.useFakeTimers({doNotFake: ['Date'], legacyFakeTimers: true}));
expectError(jest.useFakeTimers({enableGlobally: true, legacyFakeTimers: true}));
expectError(jest.useFakeTimers({legacyFakeTimers: true, now: 1483228800000}));
expectError(jest.useFakeTimers({legacyFakeTimers: true, timerLimit: 1000}));

expectType<typeof jest>(jest.useFakeTimers({now: 1483228800000}));
expectType<typeof jest>(jest.useFakeTimers({now: Date.now()}));
expectType<typeof jest>(jest.useFakeTimers({now: new Date(1995, 11, 17)}));
expectError(jest.useFakeTimers({now: '1995-12-17T03:24:00'}));

expectType<typeof jest>(jest.useFakeTimers({timerLimit: 1000}));
expectError(jest.useFakeTimers({timerLimit: true}));

expectError(jest.useFakeTimers({enableGlobally: true}));
expectError(jest.useFakeTimers('legacy'));
expectError(jest.useFakeTimers('modern'));

expectType<typeof jest>(jest.useRealTimers());
expectError(jest.useRealTimers(true));

// Misc

expectType<typeof jest>(jest.setTimeout(6000));
expectError(jest.setTimeout());

expectType<typeof jest>(jest.retryTimes(3));
expectError(jest.retryTimes());
