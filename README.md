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

  - [`jest.autoMockOff()`](http://facebook.github.io/jest/docs/api.html#jestautomockoff)
  - [`jest.autoMockOn()`](http://facebook.github.io/jest/docs/api.html#jestautomockon)
  - [`jest.clearAllTimers()`](http://facebook.github.io/jest/docs/api.html#jestclearalltimers)
  - [`jest.dontMock(module)`](http://facebook.github.io/jest/docs/api.html#jestdontmockmodulename)
  - [`jest.genMockFromModule(moduleObj)`](http://facebook.github.io/jest/docs/api.html#jestgenmockfrommodulemoduleobj)
  - [`jest.genMockFunction()`](http://facebook.github.io/jest/docs/api.html#jestgenmockfunction)
  - [`jest.genMockFn()`](http://facebook.github.io/jest/docs/api.html#jestgenmockfn)
  - [`jest.mock(moduleName)`](http://facebook.github.io/jest/docs/api.html#jestmockmodulename)
  - [`jest.runAllTicks()`](http://facebook.github.io/jest/docs/api.html#jestrunallticks)
  - [`jest.runAllTimers()`](http://facebook.github.io/jest/docs/api.html#jestrunalltimers)
  - [`jest.runOnlyPendingTimers()`](http://facebook.github.io/jest/docs/api.html#jestrunonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](http://facebook.github.io/jest/docs/api.html#jestsetmockmodulenamemoduleexports)

#### Mock functions

  - [`mockFn.mock.calls`](http://facebook.github.io/jest/docs/api.html#mockfnmockcalls)
  - [`mockFn.mock.instances`](http://facebook.github.io/jest/docs/api.html#mockfnmockinstances)
  - [`mockFn.mockClear()`](http://facebook.github.io/jest/docs/api.html#mockfnmockclear)
  - [`mockFn.mockImplementation(fn)`](http://facebook.github.io/jest/docs/api.html#mockfnmockimplementationfn)
  - [`mockFn.mockImpl(fn)`](http://facebook.github.io/jest/docs/api.html#mockfnmockimplfn)
  - [`mockFn.mockReturnThis()`](http://facebook.github.io/jest/docs/api.html#mockfnmockreturnthis)
  - [`mockFn.mockReturnValue(value)`](http://facebook.github.io/jest/docs/api.html#mockfnmockreturnvaluevalue)
  - [`mockFn.mockReturnValueOnce(value)`](http://facebook.github.io/jest/docs/api.html#mockfnmockreturnvalueoncevalue)

#### Config options

  - [`config.collectCoverage`](http://facebook.github.io/jest/docs/api.html#configcollectcoverage)
  - [`config.collectCoverageOnlyFrom`](http://facebook.github.io/jest/docs/api.html#configcollectcoverageonlyfrom)
  - [`config.moduleLoader`](http://facebook.github.io/jest/docs/api.html#configmoduleloader)
  - [`config.moduleLoaderPathIgnores`](http://facebook.github.io/jest/docs/api.html#configmoduleloaderpathignores)
  - [`config.name`](http://facebook.github.io/jest/docs/api.html#configname)
  - [`config.rootDir`](http://facebook.github.io/jest/docs/api.html#configrootdir)
  - [`config.scriptPreprocessor`](http://facebook.github.io/jest/docs/api.html#configscriptpreprocessor)
  - [`config.setupEnvScriptFile`](http://facebook.github.io/jest/docs/api.html#configsetupenvscriptfile)
  - [`config.setupTestFrameworkScriptFile`](http://facebook.github.io/jest/docs/api.html#configsetuptestframeworkscriptfile)
  - [`config.testPathDirs`](http://facebook.github.io/jest/docs/api.html#configtestpathdirs)
  - [`config.testPathIgnores`](http://facebook.github.io/jest/docs/api.html#configtestpathignores)
  - [`config.testRunner`](http://facebook.github.io/jest/docs/api.html#configtestrunner)
  - [`config.testEnvironment`](http://facebook.github.io/jest/docs/api.html#configtestenvironment)
  - [`config.unmockList`](http://facebook.github.io/jest/docs/api.html#configunmocklist)

#### Globally injected variables

  - [`jest`](http://facebook.github.io/jest/docs/api.html#thejestobject)
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
