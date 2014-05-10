# [Jest](http://facebook.github.io/jest/)

Painless JavaScript Unit Testing

- **Familiar Approach**: Built on-top of the Jasmine test framework, keeping the learning curve low

- **Isolated by Default**: Integrates with require() in order to automatically mock dependencies, making most existing code testable

- **Short Feedback Loop**: Tests run in parallel and DOM apis are mocked so you can run tests on the command line

Take a look at the [website for more information](http://facebook.github.io/react/)

## Getting Started
<generated_getting_started>
Getting started with jest is pretty simple. If you want to test the following `sum.js` file,

```javascript
// sum.js
function sum(value1, value2) {
  return value1 + value2;
}
module.exports = sum;
```

1 - Create a directory `__tests__/` with a file `sum-test.js`

```javascript
// __tests__/sum-test.js
jest.dontMock('../sum');

describe('sum', function() {
  it('adds 1 + 1 to equal 2', function() {
    var sum = require('../sum');
    expect(sum(1, 2)).toBe(3);
  });
});
```

2 - Run `npm install jest-cli --save-dev`

3 - Add the following to your `package.json`

```js
{
  ...
  "scripts": {
    "test": "jest"
  }
  ...
}
```

4 - Run `npm test`

```
[PASS] __tests__/sum-test.js (0.015s)
```
</generated_getting_started>

## API

<generated_api>
## Runtime APIs
-----

#### The `jest` object

  - [`jest.autoMockOff()`](#jestautomockoff)
  - [`jest.autoMockOn()`](#jestautomockon)
  - [`jest.clearAllTimers()`](#jestclearalltimers)
  - [`jest.dontMock(module)`](#jestdontmock-modulename)
  - [`jest.genMockFromModule(moduleObj)`](#jestgenmockfrommodule-moduleobj)
  - [`jest.genMockFunction()`](#jestgenmockfunction)
  - [`jest.genMockFn()`](#jestgenmockfn)
  - [`jest.mock(moduleName)`](#jestmock-modulename)
  - [`jest.runAllTicks()`](#jestrunallticks)
  - [`jest.runAllTimers()`](#jestrunalltimers)
  - [`jest.runOnlyPendingTimers()`](#jestrunonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](#jestsetmock-modulename-moduleexports)

#### Mock functions

  - [`mockFn.mock.calls`](#mockfn-mock-calls)
  - [`mockFn.mock.instances`](#mockfn-mock-instances)
  - [`mockFn.mockClear()`](#mockfn-mockclear)
  - [`mockFn.mockImplementation(fn)`](#mockfn-mockimplementation-fn)
  - [`mockFn.mockImpl(fn)`](#mockfn-mockimpl-fn)
  - [`mockFn.mockReturnThis()`](#mockfn-mockreturnthis)
  - [`mockFn.mockReturnValue(value)`](#mockfn-mockreturnvalue-value)
  - [`mockFn.mockReturnValueOnce(value)`](#mockfn-mockreturnvalueonce-value)

#### Config options

  - [`config.collectCoverage`](#config-collectcoverage)
  - [`config.collectCoverageOnlyFrom`](#config-collectcoverageonlyfrom)
  - [`config.moduleLoader`](#config-moduleloader)
  - [`config.moduleLoaderPathIgnores`](#config-moduleloaderpathignores)
  - [`config.name`](#config-name)
  - [`config.rootDir`](#config-rootdir)
  - [`config.scriptPreprocessor`](#config-scriptpreprocessor)
  - [`config.setupEnvScriptFile`](#config-setupenvscriptfile)
  - [`config.setupTestFrameworkScriptFile`](#config-setuptestframeworkscriptfile)
  - [`config.testPathDirs`](#config-testpathdirs)
  - [`config.testPathIgnores`](#config-testpathignores)
  - [`config.testRunner`](#config-testrunner)
  - [`config.testEnvironment`](#config-testenvironment)
  - [`config.unmockList`](#config-unmocklist)

#### Globally injected variables

  - [`jest`](#the-jest-object)
  - `require(module)`
  - `describe(name, fn)`
  - `beforeEach(fn)`
  - `afterEach(fn)`
  - `it(name, fn)`
  - `it.only(name, fn)` executes [only](https://github.com/davemo/jasmine-only) this test. Useful when investigating a failure
  - `pit(name, fn)` [helper](https://www.npmjs.org/package/jasmine-pit) for promises

#### `expect(value)`

  - `.not` inverse the next comparison
  - `.toThrow(?message)`
  - `.toBe(value)` comparison using `===`
  - `.toEqual(value)` deep comparison. Use [`jasmine.any(type)`](http://jasmine.github.io/1.3/introduction.html#section-Matching_Anything_with_<code>jasmine.any</code>) to be softer
  - `.toBeFalsy()`
  - `.toBeTruthy()`
  - `.toBeNull()`
  - `.toBeUndefined()`
  - `.toBeDefined()`
  - `.toMatch(regexp)`
  - `.toContain(string)`
  - `.toBeCloseTo(number, delta)`
  - `.toBeGreaterThan(number)`
  - `.toBeLessThan(number)`
  - `.toBeCalled()`
  - `.toBeCalledWith(arg, um, ents)`
  - `.lastCalledWith(arg, um, ents)`


-----
### `jest.autoMockOff()`
Disables automatic mocking in the module loader. 

After this method is called, all `require()`s will return the real versions of each module (rather than a mocked version)

This is usually useful when you have a scenario where the number of dependencies you want to mock is far less than the number of dependencies that you don't. For example, if you're writing a test for a module that uses a large number of dependencies that can be reasonably classified as "implementation details" of the module, then you likely do not want to mock them.

Examples of dependencies that might be considered "implementation details" are things ranging from language built-ins (e.g. Array.prototype methods) to highly common utility methods (e.g. underscore/lo-dash, array utilities, class-builder libraries, etc)

### `jest.autoMockOn()`
Re-enables automatic mocking in the module loader. 

It's worth noting that automatic mocking is on by default, so this method is only useful if that default has been changes (such as by previously calling [`jest.autoMockOff()`](#jestautomockoff))

### `jest.clearAllTimers()`
Removes any pending timers from the timer system. 

This means, if any timers have been scheduled (but have not yet executed), they will be cleared and will never have the opportunity to execute in the future.

### `jest.dontMock(moduleName)`
Indicates that the module system should never return a mocked version of the specified module from `require()` (e.g. that it should always return the real module).

The most common use of this API is for specifying the module a given test intends to be testing (and thus doesn't want automatically mocked).

### `jest.genMockFromModule(moduleObj)`
Given a module exports object, use the automatic mocking system to generate a mocked version of the object for you.

This is useful when you have an object that the module system does not know about, and you want to automatically generate a mock for it.

### `jest.genMockFunction()`
Returns a freshly generated, unused [mock function](#mock-functions).

### `jest.genMockFn()`
Shorthand alias for [`jest.genMockFunction`](#jestgenmockfunction)

### `jest.mock(moduleName)`
Indicates that the module system should always return a mocked version of the specified module from `require()` (e.g. that it should never return the real module).

This is normally useful under the circumstances where you have called [`jest.autoMockOff()`](#jestautomockoff), but still wish to specify that certain particular modules should be mocked by the module system.

### `jest.runAllTicks()`
Exhausts the micro-task queue (usually interfaced in node via `process.nextTick`).

When this API is called, all pending micro-tasks that have been queued via `process.nextTick` will be executed. Additionally, if those micro-tasks themselves schedule new micro-tasks, those will be continually exhausted until there are no more micro-tasks remaining in the queue.

This is often useful for synchronously executing all pending promises in the system.

### `jest.runAllTimers()`
Exhausts the macro-task queue (AKA all tasks queued by `setTimeout()` and `setInterval()`).

When this API is called, all pending "macro-tasks" that have been queued via `setTimeout()` or `setInterval()` will be executed. Additionally if those macro-tasks themselves schedule new macro-tasks, those will be continually exuasted until there are no more macro-tasks remaining in the queue.

This is often useful for synchronously executing setTimeouts during a test in order to synchronously assert about some behavior that would only happen after the `setTimeout()` or `setInterval()` callbacks executed. See the [Timer mocks](/jest/docs/timer-mocks.html) doc for more information.

### `jest.runOnlyPendingTimers()`
Executes only the macro-tasks that are currently pending (AKA only the tasks that have been queued by `setTimeout()` or `setInterval()` up to this point). If any of the currently pending macro-tasks schedule new macro-tasks, those new tasks will not be executed by this call.

This is useful for scenarios such as one where the module under test schedules a `setTimeout()` whose callback scheduls another `setTimeout()` recursively (meaning the scheduling never stops). In these scenarios, it's useful to be able to run forward in time by a single step at a time.

### `jest.setMock(moduleName, moduleExports)`
Explicitly supplies the mock object that the module system should return for the specified module.

On occaison there are times where the automatically generated mock the module system would normally provide you isn't adequate enough for your testing needs. Normally under those circumstances you should write a [Manual mock](/jest/docs/manual-mocks.html) that is more adequate for the module in question. However, on extremely rare occaison, even a manual mock isn't suitable for your purposes and you need to build the mock yourself inside your test. 

In these (again, extremely rare) scenarios you can use this API to manually fill the slot in the module system's mock-module registry.

### `mockFn.mock.calls`
An array that represents all calls that have been made into this mock function. Each call is represented by an array of arguments that were passed during the call. 

For example: A mock function that has been called twice, first with the arguments 'arg1', 'arg2', and then again with the arguments 'arg3', 'arg4' would have a `mock.calls` array that looks like this:

```javascript
[
  ['arg1', 'arg2'],
  ['arg3', 'arg4']
]
```

### `mockFn.mock.instances`
An array that contains all the object instances that have been instantiated from this mock function.

For example: A mock function that has been instantiated twice would have the following `mock.instances` array:

```javascript
var mockFn = jest.genMockFunction();

var a = new mockFn();
var b = new mockFn();

mockFn.mock.instances[0] === a; // true
mockFn.mock.instances[1] === b; // true
```

### `mockFn.mockClear()`
Resets all information stored in the `.mock.calls` and `.mock.instances` arrays.

Often this is useful when you want to clean up a mock's usage data between two assertions.

### `mockFn.mockImplementation(fn)`
Accepts a function that should be used as the implementation of the mock. The mock itself will still record all calls that go into and instances that come from itself -- the only difference is that the implementation will also be executed when the mock is called.

For example:

```javascript
var mockFn = jest.genMockFunction().mockImplementation(function(scalar) {
  return 42 + scalar;
});

var a = mockFn(0);
var b = mockFn(1);

a === 42; // true
b === 43; // true

mockFn.mock.calls[0][0] === 0; // true
mockFn.mock.calls[1][0] === 1; // true
```

### `mockFn.mockImpl(fn)`
Shorthand alias for [`mockFn.mockImplementation(fn)`](#mockfn-mockimplementation-fn)

### `mockFn.mockReturnThis()`
Just a simple sugar function for:

```javascript
.mockImplementation(function() {
  return this;
});
```

### `mockFn.mockReturnValue(value)`
Just a simple sugar function for:

```javascript
.mockImplementation(function() {
  return value;
});
```

### `mockFn.mockReturnValueOnce(value)`
Just a simple sugar function for:

```javascript
var valueReturned = false;
.mockImplementation(function() {
  if (!valueReturned) {
    valueReturned = true;
    return value;
  }
});
```
</generated_api>
