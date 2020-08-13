/**
 * @type ./empty.d.ts
 */

import {expectError, expectType} from 'tsd';

const customMatcherFactories: jasmine.CustomMatcherFactories = {};

expectType<typeof jest>(jest.addMatchers(customMatcherFactories));
expectType<typeof jest>(jest.addMatchers({}));
expectType<typeof jest>(jest.addMatchers(customMatcherFactories));
expectType<typeof jest>(jest.autoMockOff());
expectType<typeof jest>(jest.autoMockOn());
expectType<typeof jest>(jest.clearAllMocks());
expectType<typeof jest>(jest.clearAllTimers());
expectType<typeof jest>(jest.resetAllMocks());
expectType<typeof jest>(jest.restoreAllMocks());
expectType<typeof jest>(jest.clearAllTimers());
expectType<typeof jest>(jest.deepUnmock('moduleName'));
expectType<typeof jest>(jest.disableAutomock());
expectType<typeof jest>(jest.doMock('moduleName'));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn()));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn(), {}));
expectType<typeof jest>(jest.doMock('moduleName', jest.fn(), {virtual: true}));
expectType<typeof jest>(jest.dontMock('moduleName'));
expectType<typeof jest>(jest.enableAutomock());
expectType<typeof jest>(jest.mock('moduleName'));
expectType<typeof jest>(jest.mock('moduleName', jest.fn()));
expectType<typeof jest>(jest.mock('moduleName', jest.fn(), {}));
expectType<typeof jest>(jest.mock('moduleName', jest.fn(), {virtual: true}));
expectType<typeof jest>(jest.resetModuleRegistry());
expectType<typeof jest>(jest.resetModules());
// FIXME: `isolateModules` and `retryTimes` does not exist on typeof jest.
// expectType<typeof jest>(jest.isolateModules(() => {}));
// expectType<typeof jest>(jest.retryTimes(3));
expectType<typeof jest>(jest.runAllImmediates());
expectType<typeof jest>(jest.runAllTicks());
expectType<typeof jest>(jest.runAllTimers());
expectType<typeof jest>(jest.runOnlyPendingTimers());
expectType<typeof jest>(jest.runTimersToTime(9001));
expectType<typeof jest>(jest.advanceTimersByTime(9001));
expectType<typeof jest>(jest.setMock('moduleName', {}));
expectType<typeof jest>(jest.setMock<{}>('moduleName', {}));
expectType<typeof jest>(
  jest.setMock<{a: 'b'}>('moduleName', {a: 'b'}),
);
expectType<typeof jest>(jest.setTimeout(9001));
expectType<typeof jest>(jest.unmock('moduleName'));
expectType<typeof jest>(jest.useFakeTimers());
expectType<typeof jest>(jest.useRealTimers());

// FIXME: `advanceTimersToNextTimer` does not exist on typeof jest.
// jest.advanceTimersToNextTimer();
// jest.advanceTimersToNextTimer(2);

// https://jestjs.io/docs/en/jest-object#jestusefaketimersimplementation-modern--legacy
// FIXME
// expectType<typeof jest>(jest.useFakeTimers('modern'));
// expectType<typeof jest>(jest.useFakeTimers('legacy'));
// $ExpectError
// FIXME
// expectError(jest.useFakeTimers('foo'));

// https://jestjs.io/docs/en/jest-object#jestsetsystemtimenow-number--date
// FIXME
// expectType<typeof jest>(jest.setSystemTime());
// expectType<typeof jest>(jest.setSystemTime(0));
// expectType<typeof jest>(jest.setSystemTime(new Date(0)));
// $ExpectError
// FIXME
// expectError(jest.setSystemTime('foo'));

// https://jestjs.io/docs/en/jest-object#jestgetrealsystemtime
// FIXME
// expectType<number>(jest.getRealSystemTime());
// $ExpectError
// FIXME
// expectError(jest.getRealSystemTime('foo'));

// https://jestjs.io/docs/en/jest-object#jestrequireactualmodulename
// $ExpectType any
expectType<any>(jest.requireActual('./thisReturnsTheActualModule'));

// https://jestjs.io/docs/en/jest-object#jestrequireactualmodulename
// $ExpectType string
// FIXME
// expectType<string>(jest.requireActual<string>('./thisReturnsTheActualModule'));

// https://jestjs.io/docs/en/jest-object#jestrequiremockmodulename
// $ExpectType any
expectType<any>(jest.requireMock('./thisAlwaysReturnsTheMock'));

// https://jestjs.io/docs/en/jest-object#jestrequiremockmodulename
// $ExpectType string
// FIXME
// expectType<string>(jest.requireMock<string>('./thisAlwaysReturnsTheMock'));
