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
#### The `jest` object

  - [`jest.autoMockOff()`](http://facebook.github.io/jest/docs/api.html#jest-automockoff)
  - [`jest.autoMockOn()`](http://facebook.github.io/jest/docs/api.html#jest-automockon)
  - [`jest.clearAllTimers()`](http://facebook.github.io/jest/docs/api.html#jest-clearalltimers)
  - [`jest.dontMock(module)`](http://facebook.github.io/jest/docs/api.html#jest-dontmockmodulename)
  - [`jest.genMockFromModule(moduleObj)`](http://facebook.github.io/jest/docs/api.html#jest-genmockfrommodule-moduleobj)
  - [`jest.genMockFunction()`](http://facebook.github.io/jest/docs/api.html#jest-genmockfunction)
  - [`jest.genMockFn()`](http://facebook.github.io/jest/docs/api.html#jest-genmockfn)
  - [`jest.mock(moduleName)`](http://facebook.github.io/jest/docs/api.html#jest-mockmodule-name)
  - [`jest.runAllTicks()`](http://facebook.github.io/jest/docs/api.html#jest-runallticks)
  - [`jest.runAllTimers()`](http://facebook.github.io/jest/docs/api.html#jest-runalltimers)
  - [`jest.runOnlyPendingTimers()`](http://facebook.github.io/jest/docs/api.html#jest-runonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](http://facebook.github.io/jest/docs/api.html#jest-setmock-modulename-moduleexports)

#### Mock functions

  - [`mockFn.mock.calls`](http://facebook.github.io/jest/docs/api.html#mockfn-mock-calls)
  - [`mockFn.mock.instances`](http://facebook.github.io/jest/docs/api.html#mockfn-mock-instances)
  - [`mockFn.mockClear()`](http://facebook.github.io/jest/docs/api.html#mockfn-mockclear)
  - [`mockFn.mockImplementation(fn)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockimplementation-fn)
  - [`mockFn.mockImpl(fn)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockimpl-fn)
  - [`mockFn.mockReturnThis()`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnthis)
  - [`mockFn.mockReturnValue(value)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalue-value)
  - [`mockFn.mockReturnValueOnce(value)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalueonce-value)

#### Config options

  - [`config.collectCoverage` [boolean]](http://facebook.github.io/jest/docs/api.html#config-collectcoverage-boolean)
  - [`config.collectCoverageOnlyFrom` [object]](http://facebook.github.io/jest/docs/api.html#config-collectcoverageonlyfrom-object)
  - [`config.extensions` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-extensions-array-string)
  - [`config.modulePathIgnorePatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-modulepathignorepatterns-array-string)
  - [`config.rootDir` [string]](http://facebook.github.io/jest/docs/api.html#config-rootdir-string)
  - [`config.scriptPreprocessor` [string]](http://facebook.github.io/jest/docs/api.html#config-scriptpreprocessor-string)
  - [`config.setupEnvScriptFile` [string]](http://facebook.github.io/jest/docs/api.html#config-setupenvscriptfile-string)
  - [`config.setupTestFrameworkScriptFile` [string]](http://facebook.github.io/jest/docs/api.html#config-setuptestframeworkscriptfile-string)
  - [`config.testPathDirs` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-testpathdirs-array-string)
  - [`config.testPathIgnorePatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-testpathignorepatterns-array-string)
  - [`config.unmockedModulePathPatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-unmockedmodulepathpatterns-array-string)

#### Globally injected variables

  - [`jest`](http://facebook.github.io/jest/docs/api.html#the-jest-object)
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

</generated_api>
