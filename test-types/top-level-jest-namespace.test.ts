/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'mlh-tsd';
import {jest} from '@jest/globals';
import type {Mock} from 'jest-mock';

expectType<typeof jest>(jest.autoMockOff());
expectType<typeof jest>(jest.autoMockOn());
expectType<typeof jest>(jest.clearAllMocks());
expectType<void>(jest.clearAllTimers());
expectType<typeof jest>(jest.resetAllMocks());
expectType<typeof jest>(jest.restoreAllMocks());
expectType<void>(jest.clearAllTimers());
expectType<typeof jest>(jest.deepUnmock('moduleName'));
expectType<typeof jest>(jest.disableAutomock());
expectType<typeof jest>(jest.doMock('moduleName'));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn()));

expectError(jest.doMock('moduleName', jest.fn(), {}));
expectError(jest.doMock('moduleName', jest.fn(), {virtual: true}));

expectType<typeof jest>(jest.dontMock('moduleName'));
expectType<typeof jest>(jest.enableAutomock());
expectType<typeof jest>(jest.mock('moduleName'));
expectType<typeof jest>(jest.mock('moduleName', jest.fn()));
expectType<typeof jest>(jest.mock('moduleName', jest.fn(), {}));
expectType<typeof jest>(jest.mock('moduleName', jest.fn(), {virtual: true}));
expectType<typeof jest>(jest.resetModules());
expectType<typeof jest>(jest.isolateModules(() => {}));
expectType<typeof jest>(jest.retryTimes(3));
expectType<Mock<Promise<string>, []>>(
  jest
    .fn(() => Promise.resolve('string value'))
    .mockResolvedValueOnce('A string, not a Promise'),
);
expectType<Mock<Promise<string>, []>>(
  jest
    .fn(() => Promise.resolve('string value'))
    .mockResolvedValue('A string, not a Promise'),
);
expectType<Mock<Promise<string>, []>>(
  jest
    .fn(() => Promise.resolve('string value'))
    .mockRejectedValueOnce(new Error('An error, not a string')),
);
expectType<Mock<Promise<string>, []>>(
  jest
    .fn(() => Promise.resolve('string value'))
    .mockRejectedValue(new Error('An error, not a string')),
);

expectType<void>(jest.runAllImmediates());
expectType<void>(jest.runAllTicks());
expectType<void>(jest.runAllTimers());
expectType<void>(jest.runOnlyPendingTimers());
expectType<void>(jest.advanceTimersByTime(9001));

expectType<typeof jest>(jest.setMock('moduleName', {}));
expectType<typeof jest>(jest.setMock('moduleName', {}));
expectType<typeof jest>(jest.setMock('moduleName', {a: 'b'}));
expectType<typeof jest>(jest.setTimeout(9001));
expectType<typeof jest>(jest.unmock('moduleName'));
expectType<typeof jest>(jest.useFakeTimers());
expectType<typeof jest>(jest.useRealTimers());

expectType<void>(jest.advanceTimersToNextTimer());
expectType<void>(jest.advanceTimersToNextTimer(2));

// https://jestjs.io/docs/jest-object#jestusefaketimersimplementation-modern--legacy
expectType<typeof jest>(jest.useFakeTimers('modern'));
expectType<typeof jest>(jest.useFakeTimers('legacy'));

expectError(jest.useFakeTimers('foo'));

// https://jestjs.io/docs/jest-object#jestsetsystemtimenow-number--date
expectType<void>(jest.setSystemTime());
expectType<void>(jest.setSystemTime(0));
expectType<void>(jest.setSystemTime(new Date(0)));

expectError(jest.setSystemTime('foo'));

// https://jestjs.io/docs/jest-object#jestgetrealsystemtime
expectType<number>(jest.getRealSystemTime());

expectError(jest.getRealSystemTime('foo'));

// https://jestjs.io/docs/jest-object#jestrequireactualmodulename
expectType<unknown>(jest.requireActual('./thisReturnsTheActualModule'));

// https://jestjs.io/docs/jest-object#jestrequiremockmodulename
expectType<unknown>(jest.requireMock('./thisAlwaysReturnsTheMock'));
