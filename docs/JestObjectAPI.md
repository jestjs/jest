---
id: jest-object
title: The Jest Object
layout: reference
category: API Reference
permalink: docs/jest-object.html
previous: mock-function-api
next: configuration
---

The `jest` object is automatically in scope within every test file. The methods in the `jest` object help create mocks and let you control Jest's overall behavior.

## Methods

  - [`jest.clearAllTimers()`](#jestclearalltimers)
  - [`jest.disableAutomock()`](#jestdisableautomock)
  - [`jest.enableAutomock()`](#jestenableautomock)
  - [`jest.fn(implementation)`](#jestfnimplementation)
  - [`jest.isMockFunction(fn)`](#jestismockfunctionfn)
  - [`jest.genMockFromModule(moduleName)`](#jestgenmockfrommodulemodulename)
  - [`jest.mock(moduleName, factory, options)`](#jestmockmodulename-factory-options)
  - [`jest.clearAllMocks()`](#jestclearallmocks)
  - [`jest.resetAllMocks()`](#jestresetallmocks)
  - [`jest.resetModules()`](#jestresetmodules)
  - [`jest.runAllTicks()`](#jestrunallticks)
  - [`jest.runAllTimers()`](#jestrunalltimers)
  - [`jest.runTimersToTime(msToRun)`](#jestruntimerstotimemstorun)
  - [`jest.runOnlyPendingTimers()`](#jestrunonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](#jestsetmockmodulename-moduleexports)
  - [`jest.unmock(moduleName)`](#jestunmockmodulename)
  - [`jest.useFakeTimers()`](#jestusefaketimers)
  - [`jest.useRealTimers()`](#jestuserealtimers)

-----

## Reference

### `jest.clearAllTimers()`
Removes any pending timers from the timer system.

This means, if any timers have been scheduled (but have not yet executed), they will be cleared and will never have the opportunity to execute in the future.

### `jest.disableAutomock()`
Disables automatic mocking in the module loader.

After this method is called, all `require()`s will return the real versions of each module (rather than a mocked version).

This is usually useful when you have a scenario where the number of dependencies you want to mock is far less than the number of dependencies that you don't. For example, if you're writing a test for a module that uses a large number of dependencies that can be reasonably classified as "implementation details" of the module, then you likely do not want to mock them.

Examples of dependencies that might be considered "implementation details" are things ranging from language built-ins (e.g. Array.prototype methods) to highly common utility methods (e.g. underscore/lo-dash, array utilities etc) and entire libraries like React.js.

Returns the `jest` object for chaining.

*Note: this method was previously called `autoMockOff`. When using `babel-jest`, calls to `disableAutomock` will automatically be hoisted to the top of the code block. Use `autoMockOff` if you want to explicitly avoid this behavior.*

### `jest.enableAutomock()`
Enables automatic mocking in the module loader.

Returns the `jest` object for chaining.

*Note: this method was previously called `autoMockOn`. When using `babel-jest`, calls to `enableAutomock` will automatically be hoisted to the top of the code block. Use `autoMockOn` if you want to explicitly avoid this behavior.*

### `jest.fn(implementation)`
Returns a new, unused [mock function](/jest/docs/mock-function-api.html). Optionally takes a mock implementation.

```js
  const mockFn = jest.fn();
  mockFn();
  expect(mockFn).toHaveBeenCalled();

  // With a mock implementation:
  const returnsTrue = jest.fn(() => true);
  console.log(returnsTrue()) // true;
```

### `jest.isMockFunction(fn)`
Determines if the given function is a mocked function.

### `jest.genMockFromModule(moduleName)`
Given the name of a module, use the automatic mocking system to generate a mocked version of the module for you.

This is useful when you want to create a [manual mock](/jest/docs/manual-mocks.html) that extends the automatic mock's behavior.

### `jest.mock(moduleName, factory, options)`
Mocks a module with an auto-mocked version when it is being required. `factory` and `options` are optional. For example:

```js
// banana.js
module.exports = () => 'banana';

// __tests__/test.js
jest.mock('../banana');

const banana = require('../banana'); // banana will be explicitly mocked.

banana(); // will return 'undefined' because the function is auto-mocked.
```

The second argument can be used to specify an explicit module factory that is being run instead of using Jest's automocking feature:

```js
jest.mock('../moduleName', () => {
  return jest.fn(() => 42);
});

const moduleName = require('../moduleName'); // This runs the function specified as second argument to `jest.mock`.
moduleName(); // Will return '42';
```

The third argument can be used to create virtual mocks – mocks of modules that don't exist anywhere in the system:

```js
jest.mock('../moduleName', () => {
  // custom implementation of a module that doesn't exist in JS, like a generated module or a native module in react-native.
}, {virtual: true});
```

*Note: When using `babel-jest`, calls to `mock` will automatically be hoisted to the top of the code block. Use `doMock` if you want to explicitly avoid this behavior.*

Returns the `jest` object for chaining.

### `jest.clearAllMocks()`
Clears the `mock.calls` and `mock.instances` properties of all mocks. Equivalent to calling `.mockClear()` on every mocked function.

Returns the `jest` object for chaining.

### `jest.resetAllMocks()`
Resets the state of all mocks. Equivalent to calling `.mockReset()` on every mocked function.

Returns the `jest` object for chaining.

### `jest.resetModules()`

Resets the module registry - the cache of all required modules. This is useful to isolate modules where local state might conflict between tests.

Example:
```js
const sum1 = require('../sum');
jest.resetModules();
const sum2 = require('../sum');
sum1 === sum2 // false! Both sum modules are separate "instances" of the sum module.
```

Example in a test:
```js
beforeEach(() => {
  jest.resetModules();
});

test('works', () => {
  const sum = require('../sum');
});

test('works too', () => {
  const sum = require('../sum');
  // sum is a different copy of the sum module from the previous test.
});
```

Returns the `jest` object for chaining.

### `jest.runAllTicks()`
Exhausts the **micro**-task queue (usually interfaced in node via `process.nextTick`).

When this API is called, all pending micro-tasks that have been queued via `process.nextTick` will be executed. Additionally, if those micro-tasks themselves schedule new micro-tasks, those will be continually exhausted until there are no more micro-tasks remaining in the queue.

### `jest.runAllTimers()`
Exhausts the **macro**-task queue (i.e., all tasks queued by `setTimeout()`, `setInterval()`, and `setImmediate()`).

When this API is called, all pending "macro-tasks" that have been queued via `setTimeout()` or `setInterval()` will be executed. Additionally if those macro-tasks themselves schedule new macro-tasks, those will be continually exhausted until there are no more macro-tasks remaining in the queue.

This is often useful for synchronously executing setTimeouts during a test in order to synchronously assert about some behavior that would only happen after the `setTimeout()` or `setInterval()` callbacks executed. See the [Timer mocks](/jest/docs/timer-mocks.html) doc for more information.

### `jest.runAllImmediates()`
Exhausts all tasks queued by `setImmediate()`.

### `jest.runTimersToTime(msToRun)`
Executes only the macro task queue (i.e. all tasks queued by `setTimeout()` or `setInterval()` and `setImmediate()`).

When this API is called, all pending "macro-tasks" that have been queued via `setTimeout()` or `setInterval()`, and would be executed within `msToRun` milliseconds will be executed. Additionally if those macro-tasks schedule new macro-tasks that would be executed within the same time frame, those will be executed until there are no more macro-tasks remaining in the queue, that should be run within `msToRun` milliseconds.

### `jest.runOnlyPendingTimers()`
Executes only the macro-tasks that are currently pending (i.e., only the tasks that have been queued by `setTimeout()` or `setInterval()` up to this point). If any of the currently pending macro-tasks schedule new macro-tasks, those new tasks will not be executed by this call.

This is useful for scenarios such as one where the module being tested schedules a `setTimeout()` whose callback schedules another `setTimeout()` recursively (meaning the scheduling never stops). In these scenarios, it's useful to be able to run forward in time by a single step at a time.

### `jest.setMock(moduleName, moduleExports)`
Explicitly supplies the mock object that the module system should return for the specified module.

On occasion there are times where the automatically generated mock the module system would normally provide you isn't adequate enough for your testing needs. Normally under those circumstances you should write a [manual mock](/jest/docs/manual-mocks.html) that is more adequate for the module in question. However, on extremely rare occasions, even a manual mock isn't suitable for your purposes and you need to build the mock yourself inside your test.

In these rare scenarios you can use this API to manually fill the slot in the module system's mock-module registry.

Returns the `jest` object for chaining.

*Note It is recommended to use [`jest.mock()`](#jestmockmodulename-factory-options) instead. The `jest.mock` API's second argument is a module factory instead of the expected exported module object.*

### `jest.unmock(moduleName)`
Indicates that the module system should never return a mocked version of the specified module from `require()` (e.g. that it should always return the real module).

The most common use of this API is for specifying the module a given test intends to be testing (and thus doesn't want automatically mocked).

Returns the `jest` object for chaining.

*Note: this method was previously called `dontMock`. When using `babel-jest`, calls to `unmock` will automatically be hoisted to the top of the code block. Use `dontMock` if you want to explicitly avoid this behavior.*

### `jest.useFakeTimers()`
Instructs Jest to use fake versions of the standard timer functions (`setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `nextTick`, `setImmediate` and `clearImmediate`).

Returns the `jest` object for chaining.

### `jest.useRealTimers()`
Instructs Jest to use the real versions of the standard timer functions.

Returns the `jest` object for chaining.
