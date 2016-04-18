# [Jest](http://facebook.github.io/jest/) [![Build Status](https://travis-ci.org/facebook/jest.svg?branch=master)](https://travis-ci.org/facebook/jest) [![npm version](https://badge.fury.io/js/jest-cli.svg)](http://badge.fury.io/js/jest-cli)


Painless JavaScript Unit Testing

- **Adaptable**: Jest uses Jasmine assertions by default and Jest is modular, extendible and configurable.

- **Sandboxed and Fast**: Jest virtualizes JavaScript environments, provides browser mocks and runs tests in parallel across workers.

- **Mock by Default**: Jest [automatically mocks](http://facebook.github.io/jest/docs/automatic-mocking.html#content) JavaScript [modules](http://facebook.github.io/jest/docs/common-js-testing.html#content), making most existing code testable.

## Getting Started

<generated_getting_started_start />
Let's get started by writing a test for a hypothetical `sum.js` file:

```javascript
function sum(a, b) {
  return a + b;
}
module.exports = sum;
```

Create a directory `__tests__/` with a file `sum-test.js`:

```javascript
jest.unmock('../sum'); // unmock to use the actual implementation of sum

describe('sum', () => {
  it('adds 1 + 2 to equal 3', () => {
    const sum = require('../sum');
    expect(sum(1, 2)).toBe(3);
  });
});
```

Run `npm install --save-dev jest-cli`.

Add the following to your `package.json`:

```js
"scripts": {
  "test": "jest"
}
```

Run `npm test`:

```
[PASS] __tests__/sum-test.js (0.010s)
```

The code for this example is available at
[examples/getting_started](https://github.com/facebook/jest/tree/master/examples/getting_started).

**And you are ready to enjoy working with Jest!**

### Babel Integration

If you'd like to use [Babel](http://babeljs.io/), it can easily be enabled:

```
npm install --save-dev babel-jest babel-polyfill
```

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file
in your project's root folder. For example, if you are using ES2015 and
[React.js](https://facebook.github.io/react/) with the
[`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and
[`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```js
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES2015 features and React specific syntax,
for example:

```js
jest.unmock('../CheckboxWithLabel');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import CheckboxWithLabel from '../CheckboxWithLabel';

describe('CheckboxWithLabel', () => {
  it('changes the text after click', () => {
    // Render a checkbox with label in the document
    const checkbox = TestUtils.renderIntoDocument(
      <CheckboxWithLabel labelOn="On" labelOff="Off" />
    );

    const checkboxNode = ReactDOM.findDOMNode(checkbox);

    // Verify that it's Off by default
    expect(checkboxNode.textContent).toEqual('Off');

    // ...
  });
});
```

Check out the [React tutorial](https://facebook.github.io/jest/docs/tutorial-react.html) for more.

**And you are good to go!** The next time you run Jest it will print something
like

 ```
 Using Jest CLI v<version>, jasmine2, babel-jest
 ```

The
[React](https://github.com/facebook/react/tree/master/src/renderers/shared/reconciler/__tests__),
[Relay](https://github.com/facebook/relay/tree/master/src/container/__tests__) and
[react-native](https://github.com/facebook/react-native/tree/master/Libraries/Animated/src/__tests__)
repositories have excellent examples of tests written by Facebook engineers.

### Advanced Features

#### Only run test files related to changes with `jest -o`

On large projects and applications it is often not feasible to run thousands of
tests when a single file changes. Jest uses static analysis to look up
dependency trees in reverse starting from changed JavaScript files only. During
development, it is recommended to use `jest -o` or `jest --onlyChanged` which
will find tests related to changed JavaScript files and only run relevant tests.

#### Install Jest globally

Jest can be installed globally: `npm install -g jest-cli` which will make a
global `jest` command available that can be invoked from anywhere within your
project.

#### Async testing

Promises and even async/await can be tested easily. Jest provides a helper
called `pit` for any kind of async interaction.

Assume a `user.getUserName` function that returns a promise, now consider this
async test with Babel and
[`babel-plugin-transform-async-to-generator`](http://babeljs.io/docs/plugins/transform-async-to-generator/) or
[`babel-preset-stage-3`](http://babeljs.io/docs/plugins/preset-stage-3/):

```js
jest.unmock('../user');

import * as user from '../user';

describe('async tests', () => {
  // Use `pit` instead of `it` for testing promises.
  // The promise that is being tested should be returned.
  pit('works with promises', () => {
    return user.getUserName(5)
      .then(name => expect(name).toEqual('Paul'));
  });

  pit('works with async/await', async () => {
    const userName = await user.getUserName(4);
    expect(userName).toEqual('Mark');
  });
});
```

Check out the [Async tutorial](https://facebook.github.io/jest/docs/tutorial-async.html) for more.

#### Automated Mocking and Sandboxing

Jest isolates test files into their own environment and isolates module
execution between test runs. Jest swaps out `require()` to inject mocks that
were either [created manually](https://facebook.github.io/jest/docs/manual-mocks.html)
by the user or [automatic mocks](https://facebook.github.io/jest/docs/automatic-mocking.html) through the
automocking feature.

#### Use the `--watch` option to automatically re-run tests

Jest can automatically re-run tests when files change:

```
jest --watch
```

#### Use `--bail` to abort after the first failed test.

If you don't want to wait until a full test run completes `--bail` can
be used to abort the test run after the first error.

#### Use `--coverage` to generate a code coverage report

Code coverage can be generated easily with `--coverage`.

```
-----------------------|----------|----------|----------|----------|
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |
-----------------------|----------|----------|----------|----------|
 react/                |     91.3 |    60.61 |      100 |      100 |
  CheckboxWithLabel.js |     91.3 |    60.61 |      100 |      100 |
-----------------------|----------|----------|----------|----------|
```

#### Use `--json` for CI integrations

Jest can be integrated into Continuous Integration test runs and wrapped with
other scripts to further analyze test results.

Example Output:

```js
{
  "success": true,
  "startTime": 1456983486661,
  "numTotalTests": 1,
  "numTotalTestSuites": 1,
  "numRuntimeErrorTestSuites": 0,
  "numPassedTests": 1,
  "numFailedTests": 0,
  "numPendingTests": 0,
  "testResults":[
    {
      "name": "react/__tests__/CheckboxWithLabel-test.js",
      "status": "passed",
      "startTime": 1456983488908,
      "endTime": 1456983493037
    }
  ]
}
```
<generated_getting_started_end />

## API

<generated_api_start />
#### The `jest` object

  - [`jest.clearAllTimers()`](https://facebook.github.io/jest/docs/api.html#jest-clearalltimers)
  - [`jest.currentTestPath()`](https://facebook.github.io/jest/docs/api.html#jest-currenttestpath)
  - [`jest.disableAutomock()`](https://facebook.github.io/jest/docs/api.html#jest-disableautomock)
  - [`jest.enableAutomock()`](https://facebook.github.io/jest/docs/api.html#jest-enableautomock)
  - [`jest.fn(?implementation)`](https://facebook.github.io/jest/docs/api.html#jest-fn-implementation)
  - [`jest.genMockFromModule(moduleName)`](https://facebook.github.io/jest/docs/api.html#jest-genmockfrommodule-modulename)
  - [`jest.mock(moduleName, ?factory)`](https://facebook.github.io/jest/docs/api.html#jest-mock-modulename-factory)
  - [`jest.runAllTicks()`](https://facebook.github.io/jest/docs/api.html#jest-runallticks)
  - [`jest.runAllTimers()`](https://facebook.github.io/jest/docs/api.html#jest-runalltimers)
  - [`jest.runOnlyPendingTimers()`](https://facebook.github.io/jest/docs/api.html#jest-runonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](https://facebook.github.io/jest/docs/api.html#jest-setmock-modulename-moduleexports)
  - [`jest.unmock(moduleName)`](https://facebook.github.io/jest/docs/api.html#jest-unmock-modulename)

#### Mock functions

Mock functions can be created using `jest.fn()`.

  - [`mockFn.mock.calls`](https://facebook.github.io/jest/docs/api.html#mockfn-mock-calls)
  - [`mockFn.mock.instances`](https://facebook.github.io/jest/docs/api.html#mockfn-mock-instances)
  - [`mockFn.mockClear()`](https://facebook.github.io/jest/docs/api.html#mockfn-mockclear)
  - [`mockFn.mockImplementation(fn)`](https://facebook.github.io/jest/docs/api.html#mockfn-mockimplementation-fn)
  - [`mockFn.mockReturnThis()`](https://facebook.github.io/jest/docs/api.html#mockfn-mockreturnthis)
  - [`mockFn.mockReturnValue(value)`](https://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalue-value)
  - [`mockFn.mockReturnValueOnce(value)`](https://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalueonce-value)

#### Jasmine API

Jest uses Jasmine 2 by default. An introduction to Jasmine 2 can be found
[here](http://jasmine.github.io/2.0/introduction.html).

#### require extensions

  - [`require.requireActual(moduleName)`](https://facebook.github.io/jest/docs/api.html#require-requireactual-modulename)
  - [`require.requireMock(moduleName)`](https://facebook.github.io/jest/docs/api.html#require-requiremock-modulename)

#### [Configuration Options](https://facebook.github.io/jest/docs/api.html#configuration)

  - [`automock` [boolean]](https://facebook.github.io/jest/docs/api.html#automock-boolean)
  - [`bail` [boolean]](https://facebook.github.io/jest/docs/api.html#bail-boolean)
  - [`cache` [boolean]](https://facebook.github.io/jest/docs/api.html#cache-boolean)
  - [`cacheDirectory` [string]](https://facebook.github.io/jest/docs/api.html#cachedirectory-string)
  - [`coverageDirectory` [string]](https://facebook.github.io/jest/docs/api.html#coveragedirectory-string)
  - [`collectCoverage` [boolean]](https://facebook.github.io/jest/docs/api.html#collectcoverage-boolean)
  - [`collectCoverageOnlyFrom` [object]](https://facebook.github.io/jest/docs/api.html#collectcoverageonlyfrom-object)
  - [`globals` [object]](https://facebook.github.io/jest/docs/api.html#globals-object)
  - [`mocksPattern` [string]](https://facebook.github.io/jest/docs/api.html#mockspattern-string)
  - [`moduleFileExtensions` [array<string>]](https://facebook.github.io/jest/docs/api.html#modulefileextensions-array-string)
  - [`moduleNameMapper` [object<string, string>]](https://facebook.github.io/jest/docs/api.html#modulenamemapper-object-string-string)
  - [`modulePathIgnorePatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#modulepathignorepatterns-array-string)
  - [`preprocessorIgnorePatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#preprocessorignorepatterns-array-string)
  - [`rootDir` [string]](https://facebook.github.io/jest/docs/api.html#rootdir-string)
  - [`scriptPreprocessor` [string]](https://facebook.github.io/jest/docs/api.html#scriptpreprocessor-string)
  - [`setupFiles` [array]](https://facebook.github.io/jest/docs/api.html#setupfiles-array)
  - [`setupTestFrameworkScriptFile` [string]](https://facebook.github.io/jest/docs/api.html#setuptestframeworkscriptfile-string)
  - [`testDirectoryName` [string]](https://facebook.github.io/jest/docs/api.html#testdirectoryname-string)
  - [`testEnvironment` [string]](https://facebook.github.io/jest/docs/api.html#testenvironment-string)
  - [`testFileExtensions` [array<string>]](https://facebook.github.io/jest/docs/api.html#testfileextensions-array-string)
  - [`testPathDirs` [array<string>]](https://facebook.github.io/jest/docs/api.html#testpathdirs-array-string)
  - [`testPathIgnorePatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#testpathignorepatterns-array-string)
  - [`testPathPattern` [string]](https://facebook.github.io/jest/docs/api.html#testpathpattern-string)
  - [`testResultsProcessor` [string]](https://facebook.github.io/jest/docs/api.html#testresultsprocessor-string)
  - [`testRunner` [string]](https://facebook.github.io/jest/docs/api.html#testrunner-string)
  - [`unmockedModulePathPatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#unmockedmodulepathpatterns-array-string)
  - [`verbose` [boolean]](https://facebook.github.io/jest/docs/api.html#verbose-boolean)
  - [`watchman` [boolean]](https://facebook.github.io/jest/docs/api.html#watchman-boolean)

#### Globally injected variables

  - `afterEach(fn)`
  - `beforeEach(fn)`
  - `describe(name, fn)`
  - [`expect(value)`](https://facebook.github.io/jest/docs/api.html#expect-value)
  - `it(name, fn)`
  - `fit(name, fn)` executes only this test. Useful when investigating a failure
  - [`jest`](https://facebook.github.io/jest/docs/api.html#the-jest-object)
  - `pit(name, fn)` [async helper](https://facebook.github.io/jest/docs/tutorial-async.html) for promises
  - `require(module)`
  - `require.requireActual(module)`
  - `xdescribe(name, fn)`
  - `xit(name, fn)`

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
  - `.toBeCalledWith(arg1, arg2, ...)`
  - `.lastCalledWith(arg1, arg2, ...)`

-----

## Jest API

### `jest.clearAllTimers()`
Removes any pending timers from the timer system.

This means, if any timers have been scheduled (but have not yet executed), they will be cleared and will never have the opportunity to execute in the future.

### `jest.currentTestPath()`
Returns the absolute path to the currently executing test file.

### `jest.disableAutomock()`
Disables automatic mocking in the module loader.

After this method is called, all `require()`s will return the real versions of each module (rather than a mocked version).

This is usually useful when you have a scenario where the number of dependencies you want to mock is far less than the number of dependencies that you don't. For example, if you're writing a test for a module that uses a large number of dependencies that can be reasonably classified as "implementation details" of the module, then you likely do not want to mock them.

Examples of dependencies that might be considered "implementation details" are things ranging from language built-ins (e.g. Array.prototype methods) to highly common utility methods (e.g. underscore/lo-dash, array utilities etc) and entire libraries like React.js.

*Note: this method was previously called `autoMockOff`. When using `babel-jest`, calls to `disableAutomock` will automatically be hoisted to the top of the code block. Use `autoMockOff` if you want to explicitly avoid this behavior.*

### `jest.enableAutomock()`
Re-enables automatic mocking in the module loader.

*Note: this method was previously called `autoMockOn`. When using `babel-jest`, calls to `enableAutomock` will automatically be hoisted to the top of the code block. Use `autoMockOn` if you want to explicitly avoid this behavior.*

### `jest.fn(?implementation)`
Returns a new, unused [mock function](https://facebook.github.io/jest/docs/api.html#mock-functions). Optionally takes a mock
implementation.

```js
  const mockFn = jest.fn();
  mockFn();
  expect(mockFn).toBeCalled();

  // With a mock implementation:
  const returnsTrue = jest.fn(() => true);
  console.log(returnsTrue()) // true;
```

### `jest.genMockFromModule(moduleName)`
Given the name of a module, use the automatic mocking system to generate a mocked version of the module for you.

This is useful when you want to create a [manual mock](https://facebook.github.io/jest/docs/manual-mocks.html) that extends the automatic mock's behavior.

### `jest.mock(moduleName, ?factory)`
Indicates that the module system should always return a mocked version of the specified module from `require()` (e.g. that it should never return the real module).

```js
  jest.mock('moduleName');

  const moduleName = require('moduleName'); // moduleName will be explicitly mocked
```

The second argument can be used to specify an explicit module factory that is being run instead of using Jest's automocking feature:

```js
  jest.mock('moduleName', () => {
    return jest.fn(() => 42);
  });

  const moduleName = require('moduleName'); // This runs the function specified as second argument to `jest.mock`.
  moduleName(); // Will return "42";
```

*Note: When using `babel-jest`, calls to `mock` will automatically be hoisted to the top of the code block. Use `doMock` if you want to explicitly avoid this behavior.*

### `jest.runAllTicks()`
Exhausts the **micro**-task queue (usually interfaced in node via `process.nextTick`).

When this API is called, all pending micro-tasks that have been queued via `process.nextTick` will be executed. Additionally, if those micro-tasks themselves schedule new micro-tasks, those will be continually exhausted until there are no more micro-tasks remaining in the queue.

This is often useful for synchronously executing all pending promises in the system.

### `jest.runAllTimers()`
Exhausts the **macro**-task queue (i.e., all tasks queued by `setTimeout()` and `setInterval()`).

When this API is called, all pending "macro-tasks" that have been queued via `setTimeout()` or `setInterval()` will be executed. Additionally if those macro-tasks themselves schedule new macro-tasks, those will be continually exhausted until there are no more macro-tasks remaining in the queue.

This is often useful for synchronously executing setTimeouts during a test in order to synchronously assert about some behavior that would only happen after the `setTimeout()` or `setInterval()` callbacks executed. See the [Timer mocks](https://facebook.github.io/jest/docs/timer-mocks.html) doc for more information.

### `jest.runOnlyPendingTimers()`
Executes only the macro-tasks that are currently pending (i.e., only the tasks that have been queued by `setTimeout()` or `setInterval()` up to this point). If any of the currently pending macro-tasks schedule new macro-tasks, those new tasks will not be executed by this call.

This is useful for scenarios such as one where the module being tested schedules a `setTimeout()` whose callback schedules another `setTimeout()` recursively (meaning the scheduling never stops). In these scenarios, it's useful to be able to run forward in time by a single step at a time.

### `jest.setMock(moduleName, moduleExports)`
Explicitly supplies the mock object that the module system should return for the specified module.

On occasion there are times where the automatically generated mock the module system would normally provide you isn't adequate enough for your testing needs. Normally under those circumstances you should write a [manual mock](https://facebook.github.io/jest/docs/manual-mocks.html) that is more adequate for the module in question. However, on extremely rare occasions, even a manual mock isn't suitable for your purposes and you need to build the mock yourself inside your test.

In these rare scenarios you can use this API to manually fill the slot in the module system's mock-module registry.

*Note It is recommended to use [`jest.mock()`](https://facebook.github.io/jest/docs/api.html#jest-mock-modulename-factory) instead. The `jest.mock` API's second argument is a module factory instead of the expected exported module object.*

### `jest.unmock(moduleName)`
Indicates that the module system should never return a mocked version of the specified module from `require()` (e.g. that it should always return the real module).

The most common use of this API is for specifying the module a given test intends to be testing (and thus doesn't want automatically mocked).

*Note: this method was previously called `dontMock`. When using `babel-jest`, calls to `unmock` will automatically be hoisted to the top of the code block. Use `dontMock` if you want to explicitly avoid this behavior.*

## Mock API

### `mockFn.mock.calls`
An array that represents all calls that have been made into this mock function. Each call is represented by an array of arguments that were passed during the call.

For example: A mock function `f` that has been called twice, with the arguments `f('arg1', 'arg2')`, and then with the arguments `f('arg3', 'arg4')` would have a `mock.calls` array that looks like this:

```js
[
  ['arg1', 'arg2'],
  ['arg3', 'arg4']
]
```

### `mockFn.mock.instances`
An array that contains all the object instances that have been instantiated from this mock function.

For example: A mock function that has been instantiated twice would have the following `mock.instances` array:

```js
var mockFn = jest.fn();

var a = new mockFn();
var b = new mockFn();

mockFn.mock.instances[0] === a; // true
mockFn.mock.instances[1] === b; // true
```

### `mockFn.mockClear()`
Resets all information stored in the [`mockFn.mock.calls`](https://facebook.github.io/jest/docs/api.html#mockfn-mock-calls) and [`mockFn.mock.instances`](https://facebook.github.io/jest/docs/api.html#mockfn-mock-instances) arrays.

Often this is useful when you want to clean up a mock's usage data between two assertions.

### `mockFn.mockImplementation(fn)`
Accepts a function that should be used as the implementation of the mock. The mock itself will still record all calls that go into and instances that come from itself – the only difference is that the implementation will also be executed when the mock is called.

*Note: `jest.fn(implementation)` is a shorthand for `mockImplementation`.*

For example:

```js
const mockFn = jest.fn().mockImplementation(scalar => 42 + scalar);
// or: jest.fn(scalar => 42 + scalar);

const a = mockFn(0);
const b = mockFn(1);

a === 42; // true
b === 43; // true

mockFn.mock.calls[0][0] === 0; // true
mockFn.mock.calls[1][0] === 1; // true
```

`mockImplementation` can also be used to mock class constructors:

```
// SomeClass.js
module.exports = class SomeClass {
  m(a, b) {}
}

// OtherModule.test.js
const SomeClass = require('SomeClass')
const mMock = jest.fn()
SomeClass.mockImplementation(() => {
  return {
    m: mMock
  }
})

const some = new SomeClass()
some.m('a', 'b')
console.log('Calls to m: ', mMock.mock.calls)
```

### `mockFn.mockReturnThis()`
Just a simple sugar function for:

```js
jest.fn(function() {
  return this;
});
```

### `mockFn.mockReturnValue(value)`

Deprecated: Use `jest.fn(() => value)` instead.

```js
const mockNumberFn = jest.fn(() => 42);
mockNumberFn(); // 42

// Deprecated behavior:
jest.genMockFunction().mockImplementation(() => value);
```

### `mockFn.mockReturnValueOnce(value)`
Just a simple sugar function for:

```js
const valueReturned = false;
jest.fn(() => {
  if (!valueReturned) {
    valueReturned = true;
    return value;
  }
});
```

## `require` Extensions

### `require.requireActual(moduleName)`

Returns the actual module instead of a mock, bypassing all checks on whether the
module should receive a mock implementation or not.

### `require.requireMock(moduleName)`

Returns a mock module instead of the actual module, bypassing all checks on
whether the module should be required normally or not.

## Configuration

Jest's configuration can be defined in the `package.json` file of your project
or through the `--config <path/to/json>` option. If you'd like to use
your `package.json` to store Jest's config, the "jest" key should be used on the
top level so Jest will know how to find your settings:

```js
{
  "name": "my-project",
  "jest": {
    "verbose": true
  }
}
```

When using the --config option, the JSON file must not contain a "jest" key:

```js
{
  "bail": true,
  "verbose": true
}
```

### `automock` [boolean]
(default: true)

By default, Jest mocks every module automatically. If you are building a small
JavaScript library and would like to use Jest, you may not want to use
automocking. You can disable this option and create manual mocks or explicitly
mock modules using `jest.mock(moduleName)`.

### `bail` [boolean]
(default: false)

By default, Jest runs all tests and produces all errors into the console upon completion. The bail config option can be used here to have Jest stop running tests after the first failure.

### `cache` [boolean]
(default: true)

By default, Jest caches heavily to speed up subsequent test runs. Sometimes this
may not be desirable and can be turned off. *Note: it is generally better
not to disable this feature, but rather run Jest with `--no-cache` once.*

### `cacheDirectory` [string]
(default: 'jest-cli/.haste_cache')

The directory where Jest should store it's cached dependency information.

Jest attempts to scan your dependency tree once (up-front) and cache it in order to ease some of the filesystem raking that needs to happen while running tests. This config option lets you customize where Jest stores that cache data on disk.

By default, it will be stored in a .haste_cache directory that sits in the jest-cli directory. This intentionally doesn't default to somewhere in your repo to spare the common case from having to add this to your .gitignore/.hgignore/etc.

### `collectCoverage` [boolean]
(default: `false`)

Indicates whether the coverage information should be collected while executing the test. Because this retrofits all executed files with coverage collection statements, it may significantly slow down your tests.

### `collectCoverageOnlyFrom` [object]
(default: `undefined`)

An object that, when present, indicates a set of files for which coverage information should be collected. Any files not present in this set will not have coverage collected for them. Since there is a performance cost for each file that we collect coverage information from, this can help prune this cost down to only the files in which you care about coverage (such as the specific modules that you are testing).

### `globals` [object]
(default: `{}`)

A set of global variables that need to be available in all test environments.

For example, the following would create a global `__DEV__` variable set to `true` in all test environments:

```js
{
  ...
  "jest": {
    "globals": {
      "__DEV__": true
    }
  }
}
```

Note that, if you specify a global reference value (like an object or array) here, and some code mutates that value in the midst of running a test, that mutation will *not* be persisted across test runs for other test files.

### `mocksPattern` [string]
(default: `(?:[\\/]|^)__mocks__[\\/]`)

A pattern that is matched against file paths to determine which folder contains manual mocks.

### `moduleFileExtensions` [array<string>]
(default: `['js', 'json', 'node']`)

An array of file extensions your modules use. If you require modules without specifying a file extension, these are the extensions Jest will look for.

If you are using TypeScript this should be `['js', 'json', 'ts']`

### `modulePathIgnorePatterns` [array<string>]
(default: `[]`)

An array of regexp pattern strings that are matched against all module paths before those paths are to be considered 'visible' to the module loader. If a given module's path matches any of the patterns, it will not be `require()`-able in the test environment.

### `moduleNameMapper` [object<string, string>]
(default: `null`)

A map from regular expressions to module names that allow to stub out resources, like images or styles with a single module.

Use `<rootDir>` string token to refer to [`rootDir`](https://facebook.github.io/jest/docs/api.html#rootdir-string) value if you want to use file paths.

Additionally, you can substitute captured regex groups using numbered backreferences.

Example:
```js
  "moduleNameMapper": {
    "^image![a-zA-Z0-9$_-]+$": "GlobalImageStub",
    "^[./a-zA-Z0-9$_-]+\.png$": "<rootDir>/RelativeImageStub.js",
    "module_name_(.*)": "<rootDir>/substituted_module_$1.js"
  }
```

### `rootDir` [string]
(default: The root of the directory containing the `package.json` *or* the [`pwd`](http://en.wikipedia.org/wiki/Pwd) if no `package.json` is found)

The root directory that Jest should scan for tests and modules within. If you put your Jest config inside your `package.json` and want the root directory to be the root of your repo, the value for this config param will default to the directory of the `package.json`.

Oftentimes, you'll want to set this to `'src'` or `'lib'`, corresponding to where in your repository the code is stored.

*Note that using `'<rootDir>'` as a string token in any other path-based config settings to refer back to this value. So, for example, if you want your [`setupFiles`](https://facebook.github.io/jest/docs/api.html#setupfiles-array) config entry to point at the `env-setup.js` file at the root of your project, you could set its value to `['<rootDir>/env-setup.js']`.*

### `scriptPreprocessor` [string]
(default: `undefined`)

The path to a module that provides a synchronous function from pre-processing source files. For example, if you wanted to be able to use a new language feature in your modules or tests that isn't yet supported by node (like, for example, ES6 classes), you might plug in one of many transpilers that compile ES6 to ES5 here.

Examples of such compilers include [jstransform](http://github.com/facebook/jstransform), [recast](http://github.com/benjamn/recast), [regenerator](http://github.com/facebook/regenerator), and [traceur](https://github.com/google/traceur-compiler).

*Note: Jest's preprocessor is only ran once per file unless the file has changed. During development of a `scriptPreprocessor` it can be useful to run Jest with `--no-cache` or to frequently [delete Jest's cache](https://facebook.github.io/jest/docs/troubleshooting.html#caching-issues).*

### `preprocessorIgnorePatterns` [array<string>]
(default: `["/node_modules/"]`)

An array of regexp pattern strings that are matched against all source file paths before preprocessing. If the test path matches any of the patterns, it will not be preprocessed.

*Note: if this option is not specified by the user and Jest detects the project as a [react-native](https://github.com/facebook/react-native) project, it will ignore the default and process every file. It is common on react-native projects to ship npm modules without pre-compiling JavaScript.*

### `setupFiles` [array]
(default: `[]`)

The paths to modules that run some code to configure or set up the testing environment before each test. Since every test runs in it's own environment, these scripts will be executed in the testing environment immediately before executing the test code itself.

It's worth noting that this code will execute *before* [`setupTestFrameworkScriptFile`](https://facebook.github.io/jest/docs/api.html#setuptestframeworkscriptfile-string).

### `setupTestFrameworkScriptFile` [string]
(default: `undefined`)

The path to a module that runs some code to configure or set up the testing framework before each test. Since [`setupFiles`](https://facebook.github.io/jest/docs/api.html#setupfiles-array) executes before the test framework is installed in the environment, this script file presents you the opportunity of running some code immediately after the test framework has been installed in the environment.

For example, Jest ships with several plug-ins to `jasmine` that work by monkey-patching the jasmine API. If you wanted to add even more jasmine plugins to the mix (or if you wanted some custom, project-wide matchers for example), you could do so in this module.

### `testDirectoryName` [string]
(default: `'__tests__'`)

The name of directories that Jest should expect to find tests in.

For example, many node projects prefer to put their tests in a `tests` directory.

### `testEnvironment` [string]
(default: `'jsdom'`)

The test environment that will be used for testing. The default environment in Jest is a browser-like environment through [jsdom](https://github.com/tmpvar/jsdom). If you are building a node service, you can use the `node` option to use a node-like environment instead.

### `testFileExtensions` [array<string>]
(default: `['js']`)

An array of file extensions that test files might have. Jest uses this when searching for tests to run.

This is useful if, for example, you are writting test files using TypeScript with a `.ts` file extension. In such a scenario, Use `['js', 'ts']` to make Jest find files that end in both `.js` and `.ts`. (Don't forget to set up a TypeScript pre-processor using [`scriptPreprocessor`](https://facebook.github.io/jest/docs/api.html#scriptpreprocessor-string) too!)

### `testPathDirs` [array<string>]
(default: `['<rootDir>']`)

A list of paths to directories that Jest should use to search for tests in.

There are times where you only want Jest to search in a single sub-directory (such as cases where you have a `src/` directory in your repo), but not the rest of the repo.

### `testPathIgnorePatterns` [array<string>]
(default: `["/node_modules/"]`)

An array of regexp pattern strings that are matched against all test paths before executing the test. If the test path matches any of the patterns, it will be skipped.

### `testPathPattern` [string]
(default: `/.*/`) - See notes below for more details on the default setting.

A regexp pattern string that is matched against all test paths before executing the test. If the test path does not match the pattern, it will be skipped.

This is useful if you need to override the default. If you are testing one file at a time the default will be set to `/.*/`, however if you pass a blob rather than a single file the default will then be the absolute path of each test file. The override may be needed on windows machines where, for example, the test full path would be `C:/myproject/__tests__/mystest.jsx.jest` and the default pattern would be set as `/C:\myproject\__tests__\mystest.jsx.jest/`.

### `testResultsProcessor` [string]
(default: `undefined`)

This option allows the use of a custom results processor. This processor must be a node module that exports a function expecting an object with the following structure as the first argument:

```
{
  "success": bool,
  "startTime": epoch,
  "numTotalTestSuites": number,
  "numPassedTestSuites": number,
  "numFailedTestSuites": number,
  "numRuntimeErrorTestSuites": number,
  "numTotalTests": number,
  "numPassedTests": number,
  "numFailedTests": number,
  "numPendingTests": number,
  "testResults": [{
    "numFailingTests": number,
    "numPassingTests": number,
    "numPendingTests": number,
    "testResults": [{
      "title": string (message in it block),
      "status": "failed" | "pending" | "passed",
      "ancestorTitles": [string (message in describe blocks)],
      "failureMessages": [string],
      "numPassingAsserts": number
    },
    ...
    ],
    "perfStats": {
      "start": epoch,
      "end": epoch
    },
    "testFilePath": absolute path to test file,
    "coverage": {}
  },
  ...
  ]
}
```

### `testRunner` [string]
(default: `jasmine2`)

This option allows use of a custom test runner. The default is jasmine2. Jest also ships with jasmine1 which can enabled by setting this option to `jasmine1`. A custom test runner can be provided by specifying a path to a test runner implementation.

### `unmockedModulePathPatterns` [array<string>]
(default: `[]`)

An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them. If a module's path matches any of the patterns in this list, it will not be automatically mocked by the module loader.

This is useful for some commonly used 'utility' modules that are almost always used as implementation details almost all the time (like underscore/lo-dash, etc). It's generally a best practice to keep this list as small as possible and always use explicit `jest.mock()`/`jest.unmock()` calls in individual tests. Explicit per-test setup is far easier for other readers of the test to reason about the environment the test will run in.

It is possible to override this setting in individual tests by explicitly calling `jest.mock()` at the top of the test file.

### `verbose` [boolean]
(default: `false`)

Indicates whether each individual test should be reported during the run. All errors will also still be shown on the bottom after execution.

### `watchman` [boolean]
(default: `true`)

[Watchman](https://facebook.github.io/watchman/) monitors the file system for
changes and is used by Jest for crawling for files. Disable this if you cannot
use watchman or use the `--no-watchman` flag.
<generated_api_end />

## Local Development

For local development the `setup.sh` file is run to link all packages together.
On most platforms this will be run automatically after `npm install`, however if
you find that Jest does not set up the development environment correctly, this
script can also be run manually.
