/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectError, expectType} from 'tsd-lite';
import {jest} from '@jest/globals';
import type {
  Mock,
  MockInstance,
  Mocked,
  MockedClass,
  MockedFunction,
  MockedObject,
  MockedShallow,
  ModuleMocker,
} from 'jest-mock';

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

const someModule = {
  methodA: () => {},
  propertyB: 'B',
};

expectType<unknown>(jest.createMockFromModule('moduleName'));
expectType<Mocked<typeof someModule>>(
  jest.createMockFromModule<typeof someModule>('moduleName'),
);
expectError(jest.createMockFromModule());

expectType<typeof jest>(jest.deepUnmock('moduleName'));
expectError(jest.deepUnmock());

expectType<typeof jest>(jest.doMock('moduleName'));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn()));
expectType<typeof jest>(
  jest.doMock<{some: 'test'}>('moduleName', () => ({some: 'test'})),
);
expectType<typeof jest>(jest.doMock('moduleName', jest.fn(), {}));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn(), {virtual: true}));
expectError(jest.doMock());
expectError(jest.doMock<{some: 'test'}>('moduleName', () => false));

expectType<typeof jest>(jest.dontMock('moduleName'));
expectError(jest.dontMock());

expectType<typeof jest>(jest.disableAutomock());
expectError(jest.disableAutomock(true));

expectType<typeof jest>(jest.enableAutomock());
expectError(jest.enableAutomock('moduleName'));

expectType<typeof jest>(jest.isolateModules(() => {}));
expectError(jest.isolateModules());

expectType<Promise<void>>(jest.isolateModulesAsync(async () => {}));
expectError(jest.isolateModulesAsync(() => {}));
expectError(jest.isolateModulesAsync());

expectType<typeof jest>(jest.mock('moduleName'));
expectType<typeof jest>(jest.mock('moduleName', jest.fn()));
expectType<typeof jest>(
  jest.mock<{some: 'test'}>('moduleName', () => ({some: 'test'})),
);
expectType<typeof jest>(jest.mock('moduleName', jest.fn(), {}));
expectType<typeof jest>(jest.mock('moduleName', jest.fn(), {virtual: true}));
expectError(jest.mock());
expectError(jest.mock<{some: 'test'}>('moduleName', () => false));

expectType<typeof jest>(jest.unstable_mockModule('moduleName', jest.fn()));
expectType<typeof jest>(
  jest.unstable_mockModule<{some: 'test'}>('moduleName', () => ({
    some: 'test',
  })),
);
expectType<typeof jest>(
  jest.unstable_mockModule('moduleName', () => Promise.resolve(jest.fn())),
);
expectType<typeof jest>(
  jest.unstable_mockModule<{some: 'test'}>('moduleName', () =>
    Promise.resolve({
      some: 'test',
    }),
  ),
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
expectError(jest.unstable_mockModule('moduleName'));
expectError(
  jest.unstable_mockModule<{some: 'test'}>('moduleName', () => false),
);
expectError(
  jest.unstable_mockModule<{some: 'test'}>('moduleName', () =>
    Promise.resolve(false),
  ),
);

expectType<unknown>(jest.requireActual('./pathToModule'));
expectType<{some: 'module'}>(
  jest.requireActual<{some: 'module'}>('./pathToModule'),
);
expectError(jest.requireActual());

expectType<unknown>(jest.requireMock('./pathToModule'));
expectType<{some: 'module'}>(
  jest.requireMock<{some: 'module'}>('./pathToModule'),
);
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
  expectType<MockInstance<(a: number, b: string) => boolean>>(surelySpy);

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

expectType<ModuleMocker['replaceProperty']>(jest.replaceProperty);

// Mock<T>

expectType<Mock<() => boolean>>({} as jest.Mock<() => boolean>);
expectType<Mock<(a: string) => string>>({} as jest.Mock<(a: string) => string>);

// Mocked*<T>

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

  _propertyC: false,

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

  set propertyC(value) {
    this._propertyC = value;
  },
  get propertyC() {
    return this._propertyC;
  },

  someClassInstance: new SomeClass('value'),
};

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

// mocked()

expectType<Mocked<typeof someObject>>(jest.mocked(someObject));
expectType<Mocked<typeof someObject>>(
  jest.mocked(someObject, {shallow: false}),
);
expectType<MockedShallow<typeof someObject>>(
  jest.mocked(someObject, {shallow: true}),
);

expectError(jest.mocked('abc'));

const mockObjectA = jest.mocked(someObject);

expectType<[]>(mockObjectA.methodA.mock.calls[0]);
expectType<[b: string]>(mockObjectA.methodB.mock.calls[0]);
expectType<[c: number]>(mockObjectA.methodC.mock.calls[0]);

expectType<[t: number]>(mockObjectA.one.more.time.mock.calls[0]);

expectType<[one: string, two?: boolean]>(mockObjectA.SomeClass.mock.calls[0]);
expectType<[]>(mockObjectA.SomeClass.prototype.methodA.mock.calls[0]);
expectType<[a: string, b?: number]>(
  mockObjectA.SomeClass.prototype.methodB.mock.calls[0],
);

expectType<[]>(mockObjectA.someClassInstance.methodA.mock.calls[0]);
expectType<[a: string, b?: number]>(
  mockObjectA.someClassInstance.methodB.mock.calls[0],
);

expectError(mockObjectA.methodA.mockReturnValue(123));
expectError(mockObjectA.methodA.mockImplementation((a: number) => 123));
expectError(mockObjectA.methodB.mockReturnValue(123));
expectError(mockObjectA.methodB.mockImplementation((b: number) => 123));
expectError(mockObjectA.methodC.mockReturnValue(123));
expectError(mockObjectA.methodC.mockImplementation((c: number) => 123));

expectError(mockObjectA.one.more.time.mockReturnValue(123));
expectError(mockObjectA.one.more.time.mockImplementation((t: boolean) => 123));

expectError(mockObjectA.SomeClass.prototype.methodA.mockReturnValue(123));
expectError(
  mockObjectA.SomeClass.prototype.methodA.mockImplementation(
    (a: number) => 123,
  ),
);
expectError(mockObjectA.SomeClass.prototype.methodB.mockReturnValue(123));
expectError(
  mockObjectA.SomeClass.prototype.methodB.mockImplementation(
    (a: number) => 123,
  ),
);

expectError(mockObjectA.someClassInstance.methodA.mockReturnValue(123));
expectError(
  mockObjectA.someClassInstance.methodA.mockImplementation((a: number) => 123),
);
expectError(mockObjectA.someClassInstance.methodB.mockReturnValue(123));
expectError(
  mockObjectA.someClassInstance.methodB.mockImplementation((a: number) => 123),
);

expectAssignable<typeof someObject>(mockObjectA);

// shallow mocked()

const mockObjectB = jest.mocked(someObject, {shallow: true});

expectType<[]>(mockObjectB.methodA.mock.calls[0]);
expectType<[b: string]>(mockObjectB.methodB.mock.calls[0]);
expectType<[c: number]>(mockObjectB.methodC.mock.calls[0]);

expectError(mockObjectB.one.more.time.mock.calls[0]);

expectType<[one: string, two?: boolean]>(mockObjectB.SomeClass.mock.calls[0]);
expectType<[]>(mockObjectB.SomeClass.prototype.methodA.mock.calls[0]);
expectType<[a: string, b?: number]>(
  mockObjectB.SomeClass.prototype.methodB.mock.calls[0],
);

expectError(mockObjectB.someClassInstance.methodA.mock.calls[0]);
expectError(mockObjectB.someClassInstance.methodB.mock.calls[0]);

expectError(mockObjectB.methodA.mockReturnValue(123));
expectError(mockObjectB.methodA.mockImplementation((a: number) => 123));
expectError(mockObjectB.methodB.mockReturnValue(123));
expectError(mockObjectB.methodB.mockImplementation((b: number) => 123));
expectError(mockObjectB.methodC.mockReturnValue(123));
expectError(mockObjectB.methodC.mockImplementation((c: number) => 123));

expectError(mockObjectB.SomeClass.prototype.methodA.mockReturnValue(123));
expectError(
  mockObjectB.SomeClass.prototype.methodA.mockImplementation(
    (a: number) => 123,
  ),
);
expectError(mockObjectB.SomeClass.prototype.methodB.mockReturnValue(123));
expectError(
  mockObjectB.SomeClass.prototype.methodB.mockImplementation(
    (a: number) => 123,
  ),
);

expectAssignable<typeof someObject>(mockObjectB);

// Replaced

expectAssignable<jest.Replaced<number>>(
  jest.replaceProperty(someObject, 'propertyA', 123),
);

// Spied

expectAssignable<jest.Spied<typeof someObject.methodA>>(
  jest.spyOn(someObject, 'methodA'),
);

expectAssignable<jest.Spied<typeof someObject.SomeClass>>(
  jest.spyOn(someObject, 'SomeClass'),
);

// Spied*

expectAssignable<jest.SpiedClass<typeof someObject.SomeClass>>(
  jest.spyOn(someObject, 'SomeClass'),
);

expectAssignable<jest.SpiedFunction<typeof someObject.methodB>>(
  jest.spyOn(someObject, 'methodB'),
);

expectAssignable<jest.SpiedGetter<typeof someObject.propertyC>>(
  jest.spyOn(someObject, 'propertyC', 'get'),
);

expectAssignable<jest.SpiedSetter<typeof someObject.propertyC>>(
  jest.spyOn(someObject, 'propertyC', 'set'),
);

// Mock Timers

expectType<void>(jest.advanceTimersByTime(6000));
expectError(jest.advanceTimersByTime());

expectType<Promise<void>>(jest.advanceTimersByTimeAsync(6000));
expectError(jest.advanceTimersByTimeAsync());

expectType<void>(jest.advanceTimersToNextTimer());
expectType<void>(jest.advanceTimersToNextTimer(2));
expectError(jest.advanceTimersToNextTimer('2'));

expectType<Promise<void>>(jest.advanceTimersToNextTimerAsync());
expectType<Promise<void>>(jest.advanceTimersToNextTimerAsync(2));
expectError(jest.advanceTimersToNextTimerAsync('2'));

expectType<void>(jest.clearAllTimers());
expectError(jest.clearAllTimers(false));

expectType<number>(jest.getTimerCount());
expectError(jest.getTimerCount(true));

expectType<number>(jest.now());
expectError(jest.now('1995-12-17T03:24:00'));

expectType<number>(jest.getRealSystemTime());
expectError(jest.getRealSystemTime(true));

expectType<void>(jest.runAllImmediates());
expectError(jest.runAllImmediates(true));

expectType<void>(jest.runAllTicks());
expectError(jest.runAllTicks(true));

expectType<void>(jest.runAllTimers());
expectError(jest.runAllTimers(false));

expectType<Promise<void>>(jest.runAllTimersAsync());
expectError(jest.runAllTimersAsync(false));

expectType<void>(jest.runOnlyPendingTimers());
expectError(jest.runOnlyPendingTimers(true));

expectType<Promise<void>>(jest.runOnlyPendingTimersAsync());
expectError(jest.runOnlyPendingTimersAsync(true));

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

expectType<typeof jest>(jest.retryTimes(3));
expectType<typeof jest>(jest.retryTimes(3, {logErrorsBeforeRetry: true}));
expectError(jest.retryTimes(3, {logErrorsBeforeRetry: 'all'}));
expectError(jest.retryTimes({logErrorsBeforeRetry: true}));
expectError(jest.retryTimes());

expectType<typeof jest>(jest.setTimeout(6000));
expectError(jest.setTimeout());

expectType<number>(jest.getSeed());
expectError(jest.getSeed(123));

expectType<boolean>(jest.isEnvironmentTornDown());
expectError(jest.isEnvironmentTornDown(123));
