# [Jest](http://facebook.github.io/jest/) [![Build Status](https://travis-ci.org/facebook/jest.svg?branch=master)](https://travis-ci.org/facebook/jest) [![npm version](https://badge.fury.io/js/jest-cli.svg)](http://badge.fury.io/js/jest-cli)


Painless JavaScript Unit Testing

- **Familiar Approach**: Built on top of the Jasmine test framework, using familiar expect(value).toBe(other) assertions

- **Mock by Default**: Automatically mocks CommonJS modules returned by require(), making most existing code testable

- **Short Feedback Loop**: DOM APIs are mocked and tests run in parallel via a small node.js command line utility

## Getting Started

Check out the [Getting Started](http://facebook.github.io/jest/docs/getting-started.html) tutorial. It's pretty simple!

## API

<generated_api_start />
#### The `jest` object

  - [`jest.autoMockOff()`](http://facebook.github.io/jest/docs/api.html#jest-automockoff)
  - [`jest.autoMockOn()`](http://facebook.github.io/jest/docs/api.html#jest-automockon)
  - [`jest.clearAllTimers()`](http://facebook.github.io/jest/docs/api.html#jest-clearalltimers)
  - [`jest.currentTestPath()`](http://facebook.github.io/jest/docs/api.html#jest-currenttestpath)
  - [`jest.fn(implementation?)`](http://facebook.github.io/jest/docs/api.html#jest-fn-implementation)
  - [`jest.genMockFromModule(moduleName)`](http://facebook.github.io/jest/docs/api.html#jest-genmockfrommodule-modulename)
  - [`jest.mock(moduleName)`](http://facebook.github.io/jest/docs/api.html#jest-mock-modulename)
  - [`jest.runAllTicks()`](http://facebook.github.io/jest/docs/api.html#jest-runallticks)
  - [`jest.runAllTimers()`](http://facebook.github.io/jest/docs/api.html#jest-runalltimers)
  - [`jest.runOnlyPendingTimers()`](http://facebook.github.io/jest/docs/api.html#jest-runonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](http://facebook.github.io/jest/docs/api.html#jest-setmock-modulename-moduleexports)
  - [`jest.unmock(moduleName)`](http://facebook.github.io/jest/docs/api.html#jest-unmock-modulename)

#### Mock functions

Mock functions can be created using `jest.fn()`.

  - [`mockFn.mock.calls`](http://facebook.github.io/jest/docs/api.html#mockfn-mock-calls)
  - [`mockFn.mock.instances`](http://facebook.github.io/jest/docs/api.html#mockfn-mock-instances)
  - [`mockFn.mockClear()`](http://facebook.github.io/jest/docs/api.html#mockfn-mockclear)
  - [`mockFn.mockImplementation(fn)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockimplementation-fn)
  - [`mockFn.mockReturnThis()`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnthis)
  - [`mockFn.mockReturnValue(value)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalue-value)
  - [`mockFn.mockReturnValueOnce(value)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalueonce-value)

#### require extensions

  - [`require.requireActual(moduleName)`](http://facebook.github.io/jest/docs/api.html#require-requireactual-modulename)
  - [`require.requireMock(moduleName)`](http://facebook.github.io/jest/docs/api.html#require-requiremock-modulename)

#### Config options

  - [`config.automock` [boolean]](http://facebook.github.io/jest/docs/api.html#config-automock-boolean)
  - [`config.bail` [boolean]](http://facebook.github.io/jest/docs/api.html#config-bail-boolean)
  - [`config.cache` [boolean]](http://facebook.github.io/jest/docs/api.html#config-cache-boolean)
  - [`config.cacheDirectory` [string]](http://facebook.github.io/jest/docs/api.html#config-cachedirectory-string)
  - [`config.collectCoverage` [boolean]](http://facebook.github.io/jest/docs/api.html#config-collectcoverage-boolean)
  - [`config.collectCoverageOnlyFrom` [object]](http://facebook.github.io/jest/docs/api.html#config-collectcoverageonlyfrom-object)
  - [`config.globals` [object]](http://facebook.github.io/jest/docs/api.html#config-globals-object)
  - [`config.mocksPattern` [string]](http://facebook.github.io/jest/docs/api.html#config-mockspattern-string)
  - [`config.moduleFileExtensions` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-modulefileextensions-array-string)
  - [`config.modulePathIgnorePatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-modulepathignorepatterns-array-string)
  - [`config.moduleNameMapper` [object<string, string>]](http://facebook.github.io/jest/docs/api.html#config-modulenamemapper-object-string-string)
  - [`config.preprocessCachingDisabled` [boolean]](http://facebook.github.io/jest/docs/api.html#config-preprocesscachingdisabled-boolean)
  - [`config.rootDir` [string]](http://facebook.github.io/jest/docs/api.html#config-rootdir-string)
  - [`config.scriptPreprocessor` [string]](http://facebook.github.io/jest/docs/api.html#config-scriptpreprocessor-string)
  - [`config.preprocessorIgnorePatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-preprocessorignorepatterns-array-string)
  - [`config.setupFiles` [array]](http://facebook.github.io/jest/docs/api.html#config-setupfiles-array)
  - [`config.setupTestFrameworkScriptFile` [string]](http://facebook.github.io/jest/docs/api.html#config-setuptestframeworkscriptfile-string)
  - [`config.testDirectoryName` [string]](http://facebook.github.io/jest/docs/api.html#config-testdirectoryname-string)
  - [`config.testFileExtensions` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-testfileextensions-array-string)
  - [`config.testPathDirs` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-testpathdirs-array-string)
  - [`config.testPathIgnorePatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-testpathignorepatterns-array-string)
  - [`config.testPathPattern` [string]](http://facebook.github.io/jest/docs/api.html#config-testpathpattern-string)
  - [`config.testRunner` [string]](http://facebook.github.io/jest/docs/api.html#config-testrunner-string)
  - [`config.unmockedModulePathPatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-unmockedmodulepathpatterns-array-string)
  - [`config.verbose` [boolean]](http://facebook.github.io/jest/docs/api.html#config-verbose-boolean)
  - [`config.watchman` [boolean]](http://facebook.github.io/jest/docs/api.html#config-watchman-boolean)

#### Globally injected variables

  - `afterEach(fn)`
  - `beforeEach(fn)`
  - `describe(name, fn)`
  - [`expect(value)`](http://facebook.github.io/jest/docs/api.html#expect-value)
  - `it(name, fn)`
  - `it.only(name, fn)` executes [only](https://github.com/davemo/jasmine-only) this test. Useful when investigating a failure
  - [`jest`](http://facebook.github.io/jest/docs/api.html#the-jest-object)
  - `pit(name, fn)` [helper](https://www.npmjs.org/package/jasmine-pit) for promises
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
  - `.toBeCalledWith(arg, um, ents)`
  - `.lastCalledWith(arg, um, ents)`

<generated_api_end />
