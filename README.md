# [Jest](http://facebook.github.io/jest/) [![Build Status](https://travis-ci.org/facebook/jest.svg?branch=master)](https://travis-ci.org/facebook/jest) [![npm version](https://badge.fury.io/js/jest-cli.svg)](http://badge.fury.io/js/jest-cli)


Painless JavaScript Unit Testing

- **Adaptable**: Jest uses Jasmine assertions by default and Jest is modular, extendible and configurable.

- **Sandboxed and Fast**: Jest virtualizes JavaScript environments, provides browser mocks and runs tests in parallel across workers.

- **Snapshot Testing**: Jest can [capture snapshots](http://facebook.github.io/jest/docs/tutorial-react.html#snapshot-testing) of React trees or other serializable values to write tests quickly and it provides a seamless update experience.

## Getting Started

<generated_getting_started_start />
Install Jest with `npm` by running:

```
npm install --save-dev jest
```

Great! Now let's get started by writing a test for a hypothetical `sum.js` file:

```javascript
function sum(a, b) {
  return a + b;
}
module.exports = sum;
```

Create a directory `__tests__/` with a file `sum-test.js` or name it `sum.test.js` or `sum.spec.js` and put it anywhere in your project:

```javascript
test('adds 1 + 2 to equal 3', () => {
  const sum = require('../sum');
  expect(sum(1, 2)).toBe(3);
});
```

Add the following to your `package.json`:

```js
"scripts": {
  "test": "jest"
}
```

Run `npm test`:

```
PASS __tests__/sum-test.js
```

Please read the [API documentation](https://facebook.github.io/jest/docs/api.html) to learn about all available assertions, ways of writing tests, configuration options and Jest specific APIs.

The code for this example is available at [examples/getting_started](https://github.com/facebook/jest/tree/master/examples/getting_started).

The [React](https://github.com/facebook/react/tree/master/src/renderers/shared/stack/reconciler/__tests__), [Relay](https://github.com/facebook/relay/tree/master/src/container/__tests__) and [react-native](https://github.com/facebook/react-native/tree/master/Libraries/Animated/src/__tests__) repositories have excellent examples of tests written by Facebook engineers.

**And you are ready to use Jest!**

### Babel Integration

If you'd like to use [Babel](http://babeljs.io/), it can easily be enabled:

```
npm install --save-dev babel-jest babel-polyfill
```

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file in your project's root folder. For example, if you are using ES2015 and [React.js](https://facebook.github.io/react/) with the [`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and [`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```js
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES2015 features and React specific syntax.

### React, React-Native and Snapshot Testing

Check out the [React tutorial](https://facebook.github.io/jest/docs/tutorial-react.html) and the [React-Native tutorial](https://facebook.github.io/jest/docs/tutorial-react-native.html) to get started with React or React-Native codebases.

We recommend using React's test renderer (`npm install --save-dev react-test-renderer`) to capture snapshots with Jest's snapshot feature. Write a test using `toMatchSnapshot`:

```js
import renderer from 'react-test-renderer';
it('renders correctly', () => {
  const tree = renderer.create(
    <Link page="http://www.facebook.com">Facebook</Link>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

and it will produce a snapshot like this:

```js
exports[`Link renders correctly 1`] = `
<a
  className="normal"
  href="http://www.facebook.com"
  onMouseEnter={[Function bound _onMouseEnter]}
  onMouseLeave={[Function bound _onMouseLeave]}>
  Facebook
</a>
`;
```

On subsequent test runs, Jest will compare the stored snapshot with the rendered output and highlight differences. If there are differences, Jest will ask you to fix your mistake and can be re-run with `jest -u` to update an outdated snapshot.

### Advanced Features

#### Use the interactive mode mode to automatically re-run tests

```
npm test -- --watch
// or
jest --watch
```

#### Install Jest globally

Jest can be installed globally: `npm install -g jest` which will make a global `jest` command available that can be invoked from anywhere within your project.

#### Async testing

Promises and even async/await can be tested easily.

Assume a `user.getUserName` function that returns a promise, now consider this async test with Babel and [`babel-plugin-transform-async-to-generator`](http://babeljs.io/docs/plugins/transform-async-to-generator/) or [`babel-preset-stage-3`](http://babeljs.io/docs/plugins/preset-stage-3/):

```js
import * as user from '../user';

// The promise that is being tested should be returned.
it('works with promises', () => {
  return user.getUserName(5)
    .then(name => expect(name).toEqual('Paul'));
});

it('works with async/await', async () => {
  const userName = await user.getUserName(4);
  expect(userName).toEqual('Mark');
});
```

Check out the [Async tutorial](https://facebook.github.io/jest/docs/tutorial-async.html) for more.

#### Only run test files related to changes with `jest -o`

On large projects and applications it is often not feasible to run thousands of tests when a single file changes. Jest uses static analysis to look up dependency trees in reverse starting from changed JavaScript files only. During development, it is recommended to use `jest -o` or `jest --onlyChanged` which will find tests related to changed JavaScript files and only run relevant tests.

#### Mocking and Sandboxing

Jest isolates test files into their own environment and isolates module execution between test runs. Jest swaps out `require()` and can inject mocks that were either [created manually](https://facebook.github.io/jest/docs/manual-mocks.html) by the user or automatically mocked through explicit calls to `jest.mock('moduleName')`.

#### Use `--bail` to abort after the first failed test.

If you don't want to wait until a full test run completes `--bail` can be used to abort the test run after the first error.

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

Jest can be integrated into Continuous Integration test runs and wrapped with other scripts to further analyze test results.

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
#### The Jest global environment

In your test files, Jest puts each of these methods and objects into the global environment. You don't have to require or import anything to use them.

  - `afterEach(fn)`
  - `beforeEach(fn)`
  - [`describe(name, fn)`](https://facebook.github.io/jest/docs/api.html#basic-testing)
  - [`expect(value)`](https://facebook.github.io/jest/docs/api.html#expect-value)
  - [`it(name, fn)`](https://facebook.github.io/jest/docs/api.html#basic-testing)
  - `fit(name, fn)` executes only this test. Useful when investigating a failure
  - [`jest`](https://facebook.github.io/jest/docs/api.html#the-jest-object)
  - [`require.requireActual(moduleName)`](https://facebook.github.io/jest/docs/api.html#require-requireactual-modulename)
  - [`require.requireMock(moduleName)`](https://facebook.github.io/jest/docs/api.html#require-requiremock-modulename)
  - `test(name, fn)` is an alias for `it`
  - `xdescribe(name, fn)`
  - `xit(name, fn)`

#### Writing assertions with `expect`

When you're writing tests, you need to check that values are what you
expect all the time. That's what you use `expect` for.

  - [`expect(value)`](https://facebook.github.io/jest/docs/api.html#expect-value)
  - [`.lastCalledWith(arg1, arg2, ...)`](https://facebook.github.io/jest/docs/api.html#lastcalledwith-arg1-arg2)
  - [`.not`](https://facebook.github.io/jest/docs/api.html#not)
  - [`.toBe(value)`](https://facebook.github.io/jest/docs/api.html#tobe-value)
  - [`.toBeCalled()`](https://facebook.github.io/jest/docs/api.html#tobecalled)
  - [`.toBeCalledWith(arg1, arg2, ...)`](https://facebook.github.io/jest/docs/api.html#tobecalledwith-arg1-arg2)
  - [`.toBeCloseTo(number, numDigits)`](https://facebook.github.io/jest/docs/api.html#tobecloseto-number-numdigits)
  - [`.toBeDefined()`](https://facebook.github.io/jest/docs/api.html#tobedefined)
  - [`.toBeFalsy()`](https://facebook.github.io/jest/docs/api.html#tobefalsy)
  - [`.toBeGreaterThan(number)`](https://facebook.github.io/jest/docs/api.html#tobegreaterthan-number)
  - [`.toBeGreaterThanOrEqual(number)`](https://facebook.github.io/jest/docs/api.html#tobegreaterthanorequal-number)
  - [`.toBeLessThan(number)`](https://facebook.github.io/jest/docs/api.html#tobelessthan-number)
  - [`.toBeLessThanOrEqual(number)`](https://facebook.github.io/jest/docs/api.html#tobelessthanorequal-number)
  - [`.toBeNull()`](https://facebook.github.io/jest/docs/api.html#tobenull)
  - [`.toBeTruthy()`](https://facebook.github.io/jest/docs/api.html#tobetruthy)
  - [`.toBeUndefined()`](https://facebook.github.io/jest/docs/api.html#tobeundefined)
  - [`.toContain(item)`](https://facebook.github.io/jest/docs/api.html#tocontain-item)
  - [`.toEqual(value)`](https://facebook.github.io/jest/docs/api.html#toequal-value)
  - [`.toMatch(regexp)`](https://facebook.github.io/jest/docs/api.html#tomatch-regexp)
  - [`.toMatchSnapshot()`](https://facebook.github.io/jest/docs/api.html#tomatchsnapshot)
  - [`.toThrow()`](https://facebook.github.io/jest/docs/api.html#tothrow)
  - [`.toThrowError(error)`](https://facebook.github.io/jest/docs/api.html#tothrowerror-error)

#### Mock functions

Mock functions are also known as "spies", because they let you spy on the behavior of a function that is called indirectly by some other code, rather than just testing the output. You can create a mock function with `jest.fn()`.

  - [`mockFn.mock.calls`](https://facebook.github.io/jest/docs/api.html#mockfn-mock-calls)
  - [`mockFn.mock.instances`](https://facebook.github.io/jest/docs/api.html#mockfn-mock-instances)
  - [`mockFn.mockClear()`](https://facebook.github.io/jest/docs/api.html#mockfn-mockclear)
  - [`mockFn.mockImplementation(fn)`](https://facebook.github.io/jest/docs/api.html#mockfn-mockimplementation-fn)
  - [`mockFn.mockImplementationOnce(fn)`](https://facebook.github.io/jest/docs/api.html#mockfn-mockimplementationonce-fn)
  - [`mockFn.mockReturnThis()`](https://facebook.github.io/jest/docs/api.html#mockfn-mockreturnthis)
  - [`mockFn.mockReturnValue(value)`](https://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalue-value)
  - [`mockFn.mockReturnValueOnce(value)`](https://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalueonce-value)

#### The `jest` object

These methods help create mocks and let you control Jest's overall behavior.

  - [`jest.clearAllTimers()`](https://facebook.github.io/jest/docs/api.html#jest-clearalltimers)
  - [`jest.disableAutomock()`](https://facebook.github.io/jest/docs/api.html#jest-disableautomock)
  - [`jest.enableAutomock()`](https://facebook.github.io/jest/docs/api.html#jest-enableautomock)
  - [`jest.fn(?implementation)`](https://facebook.github.io/jest/docs/api.html#jest-fn-implementation)
  - [`jest.isMockFunction(fn)`](https://facebook.github.io/jest/docs/api.html#jest-ismockfunction-fn)
  - [`jest.genMockFromModule(moduleName)`](https://facebook.github.io/jest/docs/api.html#jest-genmockfrommodule-modulename)
  - [`jest.mock(moduleName, ?factory, ?options)`](https://facebook.github.io/jest/docs/api.html#jest-mock-modulename-factory-options)
  - [`jest.resetModules()`](https://facebook.github.io/jest/docs/api.html#jest-resetmodules)
  - [`jest.runAllTicks()`](https://facebook.github.io/jest/docs/api.html#jest-runallticks)
  - [`jest.runAllTimers()`](https://facebook.github.io/jest/docs/api.html#jest-runalltimers)
  - [`jest.runOnlyPendingTimers()`](https://facebook.github.io/jest/docs/api.html#jest-runonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](https://facebook.github.io/jest/docs/api.html#jest-setmock-modulename-moduleexports)
  - [`jest.unmock(moduleName)`](https://facebook.github.io/jest/docs/api.html#jest-unmock-modulename)
  - [`jest.useFakeTimers()`](https://facebook.github.io/jest/docs/api.html#jest-usefaketimers)
  - [`jest.useRealTimers()`](https://facebook.github.io/jest/docs/api.html#jest-userealtimers)

#### [Configuration Options](https://facebook.github.io/jest/docs/api.html#configuration)

These options let you control Jest's behavior in your `package.json` file. The Jest philosophy is to work great by default, but sometimes you just need more configuration power.

  - [`automock` [boolean]](https://facebook.github.io/jest/docs/api.html#automock-boolean)
  - [`browser` [boolean]](https://facebook.github.io/jest/docs/api.html#browser-boolean)
  - [`bail` [boolean]](https://facebook.github.io/jest/docs/api.html#bail-boolean)
  - [`cacheDirectory` [string]](https://facebook.github.io/jest/docs/api.html#cachedirectory-string)
  - [`coverageDirectory` [string]](https://facebook.github.io/jest/docs/api.html#coveragedirectory-string)
  - [`collectCoverage` [boolean]](https://facebook.github.io/jest/docs/api.html#collectcoverage-boolean)
  - [`collectCoverageOnlyFrom` [object]](https://facebook.github.io/jest/docs/api.html#collectcoverageonlyfrom-object)
  - [`coveragePathIgnorePatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#coveragepathignorepattern-array-string)
  - [`coverageThreshold` [object]](https://facebook.github.io/jest/docs/api.html#coveragethreshold-object)
  - [`globals` [object]](https://facebook.github.io/jest/docs/api.html#globals-object)
  - [`mocksPattern` [string]](https://facebook.github.io/jest/docs/api.html#mockspattern-string)
  - [`moduleDirectories` [array<string>]](https://facebook.github.io/jest/docs/api.html#moduledirectories-array-string)
  - [`moduleFileExtensions` [array<string>]](https://facebook.github.io/jest/docs/api.html#modulefileextensions-array-string)
  - [`moduleNameMapper` [object<string, string>]](https://facebook.github.io/jest/docs/api.html#modulenamemapper-object-string-string)
  - [`modulePaths` [array<string>]](https://facebook.github.io/jest/docs/api.html#modulepaths-array-string)
  - [`modulePathIgnorePatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#modulepathignorepatterns-array-string)
  - [`notify` [boolean]](https://facebook.github.io/jest/docs/api.html#notify-boolean)
  - [`preprocessorIgnorePatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#preprocessorignorepatterns-array-string)
  - [`preset` [string]](https://facebook.github.io/jest/docs/api.html#preset-string)
  - [`resetModules` [boolean]](https://facebook.github.io/jest/docs/api.html#resetmodules-boolean)
  - [`rootDir` [string]](https://facebook.github.io/jest/docs/api.html#rootdir-string)
  - [`scriptPreprocessor` [string]](https://facebook.github.io/jest/docs/api.html#scriptpreprocessor-string)
  - [`setupFiles` [array]](https://facebook.github.io/jest/docs/api.html#setupfiles-array)
  - [`setupTestFrameworkScriptFile` [string]](https://facebook.github.io/jest/docs/api.html#setuptestframeworkscriptfile-string)
  - [`testEnvironment` [string]](https://facebook.github.io/jest/docs/api.html#testenvironment-string)
  - [`testPathDirs` [array<string>]](https://facebook.github.io/jest/docs/api.html#testpathdirs-array-string)
  - [`testPathIgnorePatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#testpathignorepatterns-array-string)
  - [`testPathPattern` [string]](https://facebook.github.io/jest/docs/api.html#testpathpattern-string)
  - [`testRegex` [string]](https://facebook.github.io/jest/docs/api.html#testregex-string)
  - [`testResultsProcessor` [string]](https://facebook.github.io/jest/docs/api.html#testresultsprocessor-string)
  - [`testRunner` [string]](https://facebook.github.io/jest/docs/api.html#testrunner-string)
  - [`unmockedModulePathPatterns` [array<string>]](https://facebook.github.io/jest/docs/api.html#unmockedmodulepathpatterns-array-string)
  - [`verbose` [boolean]](https://facebook.github.io/jest/docs/api.html#verbose-boolean)


-----


## The Jest global environment

### Basic Testing

All you need in a test file is the `it` method which runs a test. The convention is to name your test so that your code reads like a sentence - that's why the name of the core testing function is `it`. For example, let's say there's a function `inchesOfRain()` that should be zero. Your whole test file could be:

```js
it('did not rain', () => {
  expect(inchesOfRain()).toBe(0);
});
```

The first argument is the test name; the second argument is a function that contains the expectations to test.

It's often handy to group together several related tests in one "test suite". For example, if you have a `myBeverage` object that is supposed to be delicious but not sour, you could test it with:

```js
const myBeverage = {
  delicious: true,
  sour: false,
};

describe('my beverage', () => {
  it('is delicious', () => {
    expect(myBeverage.delicious).toBeTruthy();
  });

  it('is not sour', () => {
    expect(myBeverage.sour).toBeFalsy();
  });
})
```

To test an asynchronous function, just return a promise from `it`. When running tests, Jest will wait for the promise to resolve before letting the test complete.

For example, let's say `fetchBeverageList()` returns a promise that is supposed to resolve to a list that has `lemon` in it. You can test this with:

```js
describe('my beverage list', () => {
  it('has lemon in it', () => {
    return fetchBeverageList().then((list) => {
      expect(list).toContain('lemon');
    });
  });
});
```

Even though the call to `it` will return right away, the test doesn't complete until the promise resolves as well.

### `require.requireActual(moduleName)`

Returns the actual module instead of a mock, bypassing all checks on whether the
module should receive a mock implementation or not.

### `require.requireMock(moduleName)`

Returns a mock module instead of the actual module, bypassing all checks on
whether the module should be required normally or not.

## Writing assertions with `expect`

### `expect(value)`

The `expect` function is used every time you want to test a value. You will rarely call `expect` by itself. Instead, you will use `expect` along with a "matcher" function to assert something about a value.

It's easier to understand this with an example. Let's say you have a method `bestLaCroixFlavor()` which is supposed to return the string `'grapefruit'`.
Here's how you would test that:

```js
describe('the best La Croix flavor', () => {
  it('is grapefruit', () => {
    expect(bestLaCroixFlavor()).toBe('grapefruit');
  });
});
```

In this case, `toBe` is the matcher function. There are a lot of different matcher functions, documented below, to help you test different things.

The argument to `expect` should be the value that your code produces, and any argument to the matcher should be the correct value. If you mix them up, your tests will still work, but the error messages on failing tests will look strange.

### `.lastCalledWith(arg1, arg2, ...)`

If you have a mock function, you can use `.lastCalledWith` to test what arguments it was last called with. For example, let's say you have a `applyToAllFlavors(f)` function that applies `f` to a bunch of flavors, and you want to ensure that when you call it, the last flavor it operates on is `'mango'`. You can write:

```js
describe('applying to all flavors', () => {
  it('does mango last', () => {
    let drink = jest.fn();
    applyToAllFlavors(drink);
    expect(drink).lastCalledWith('mango');
  });
});
```

### `.not`

If you know how to test something, `.not` lets you test its opposite. For example, this code tests that the best La Croix flavor is not coconut:

```js
describe('the best La Croix flavor', () => {
  it('is not coconut', () => {
    expect(bestLaCroixFlavor()).not.toBe('coconut');
  });
});
```

### `.toBe(value)`

`toBe` just checks that a value is what you expect. It uses `===` to check
strict equality.

For example, this code will validate some properties of the `beverage` object:

```js
const can = {
  ounces: 12,
  name: 'pamplemousse',
};

describe('the can', () => {
  it('has 12 ounces', () => {
    expect(can.ounces).toBe(12);
  });

  it('has a sophisticated name', () => {
    expect(can.name).toBe('pamplemousse');
  });
});
```

Don't use `toBe` with floating-point numbers. For example, due to rounding, in JavaScript `0.2 + 0.1` is not strictly equal to `0.3`. If you have floating point numbers, try `.toBeCloseTo` instead.

### `.toBeCalled()`

Use `.toBeCalled` to ensure that a mock function got called.

For example, let's say you have a `drinkAll(drink, flavor)` function that takes a `drink` function and applies it to all available beverages. You might want to check that `drink` gets called for `'lemon'`, but not for `'octopus'`, because `'octopus'` flavor is really weird and why would anything be octopus-flavored? You can do that with this test suite:

```js
describe('drinkAll', () => {
  it('drinks something lemon-flavored', () => {
    let drink = jest.fn();
    drinkAll(drink, 'lemon');
    expect(drink).toBeCalled();
  });

  it('does not drink something octopus-flavored', () => {
    let drink = jest.fn();
    drinkAll(drink, 'octopus');
    expect(drink).not.toBeCalled();
  });
});
```

### `.toBeCalledWith(arg1, arg2, ...)`

Use `.toBeCalledWith` to ensure that a mock function was called with specific
arguments.

For example, let's say that you can register a beverage with a `register` function, and `applyToAll(f)` should apply the function `f` to all registered beverages. To make sure this works, you could write:

```js
describe('beverage registration', () => {
  it('applies correctly to orange La Croix', () => {
    let beverage = new LaCroix('orange');
    register(beverage);
    let f = jest.fn();
    applyToAll(f);
    expect(f).toBeCalledWith(beverage);
  });
});
```

### `.toBeCloseTo(number, numDigits)`

Using exact equality with floating point numbers is a bad idea. Rounding means that intuitive things fail. For example, this test fails:

```js
describe('adding numbers', () => {
  it('works sanely with simple decimals', () => {
    expect(0.2 + 0.1).toBe(0.3); // Fails!
  });
});
```

It fails because in JavaScript, `0.2 + 0.1` is actually `0.30000000000000004`. Sorry.

Instead, use `.toBeCloseTo`. Use `numDigits` to control how many digits after the decimal point to check. For example, if you want to be sure that `0.2 + 0.1` is equal to `0.3` with a precision of 5 decimal digits, you can use this test:

```js
describe('adding numbers', () => {
  it('works sanely with simple decimals', () => {
    expect(0.2 + 0.1).toBeCloseTo(0.3, 5);
  });
});
```

The default for `numDigits` is 2, which has proved to be a good default in most cases.

### `.toBeDefined()`

Use `.toBeDefined` to check that a variable is not undefined. For example, if you just want to check that a function `fetchNewFlavorIdea()` returns *something*, you can write:

```js
describe('fetching new flavor ideas', () => {
  it('returns something', () => {
    expect(fetchNewFlavorIdea()).toBeDefined();
  });
});
```

You could write `expect(fetchNewFlavorIdea()).not.toBe(undefined)`, but it's better practice to avoid referring to `undefined` directly in your code.

### `.toBeFalsy()`

Use `.toBeFalsy` when you don't care what a value is, you just want to ensure a value is false in a boolean context. For example, let's say you have some application code that looks like:

```js
drinkSomeLaCroix();
if (!getErrors()) {
  drinkMoreLaCroix();
}
```

You may not care what `getErrors` returns, specifically - it might return `false`, `null`, or `0`, and your code would still work. So if you want to test there are no errors after drinking some La Croix, you could write:

```js
describe('drinking some La Croix', () => {
  it('does not lead to errors', () => {
    drinkSomeLaCroix();
    expect(getErrors()).toBeFalsy();
  });
});
```

In JavaScript, there are six falsy values: `false`, `0`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy.

### `.toBeGreaterThan(number)`

To compare floating point numbers, you can use `toBeGreaterThan`. For example, if you want to test that `ouncesPerCan()` returns a value of more than 10 ounces, write:

```js
describe('ounces per can', () => {
  it('is more than 10', () => {
    expect(ouncesPerCan()).toBeGreaterThan(10);
  });
});
```

### `.toBeGreaterThanOrEqual(number)`

To compare floating point numbers, you can use `toBeGreaterThanOrEqual`. For example, if you want to test that `ouncesPerCan()` returns a value of at least 12 ounces, write:

```js
describe('ounces per can', () => {
  it('is at least 12', () => {
    expect(ouncesPerCan()).toBeGreaterThanOrEqual(12);
  });
});
```

### `.toBeLessThan(number)`

To compare floating point numbers, you can use `toBeLessThan`. For example, if you want to test that `ouncesPerCan()` returns a value of less than 20 ounces, write:

```js
describe('ounces per can', () => {
  it('is less than 20', () => {
    expect(ouncesPerCan()).toBeLessThan(10);
  });
});
```

### `.toBeLessThanOrEqual(number)`

To compare floating point numbers, you can use `toBeLessThanOrEqual`. For example, if you want to test that `ouncesPerCan()` returns a value of at most 12 ounces, write:

```js
describe('ounces per can', () => {
  it('is at most 12', () => {
    expect(ouncesPerCan()).toBeLessThanOrEqual(12);
  });
});
```

### `.toBeNull()`

`.toBeNull()` is the same as `.toBe(null)` but the error messages are a bit nicer. So use `.toBeNull()` when you want to check that something is null.

```js
function bloop() {
  return null;
}

describe('bloop', () => {
  it('returns null', () => {
    expect(bloop()).toBeNull();
  });
})
```

### `.toBeTruthy()`

Use `.toBeTruthy` when you don't care what a value is, you just want to ensure a value is true in a boolean context. For example, let's say you have some application code that looks like:

```js
drinkSomeLaCroix();
if (thirstInfo()) {
  drinkMoreLaCroix();
}
```

You may not care what `thirstInfo` returns, specifically - it might return `true` or a complex object, and your code would still work. So if you just want to test that `thirstInfo` will be truthy after drinking some La Croix, you could write:

```js
describe('drinking some La Croix', () => {
  it('leads to having thirst info', () => {
    drinkSomeLaCroix();
    expect(thirstInfo()).toBeTruthy();
  });
});
```

In JavaScript, there are six falsy values: `false`, `0`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy.

### `.toBeUndefined()`

Use `.toBeUndefined` to check that a variable is undefined. For example, if you want to check that a function `bestDrinkForFlavor(flavor)` returns `undefined` for the `'octopus'` flavor, because there is no good octopus-flavored drink:

```js
describe('the best drink', () => {
  it('for octopus flavor is undefined', () => {
    expect(bestDrinkForFlavor('octopus')).toBeUndefined();
  });
});
```

You could write `expect(bestDrinkForFlavor('octopus')).toBe(undefined)`, but it's better practice to avoid referring to `undefined` directly in your code.

### `.toContain(item)`

Use `.toContain` when you want to check that an item is in a list. For testing the items in the list, this uses `===`, a strict equality check.

For example, if `getAllFlavors()` returns a list of flavors and you want to be sure that `lime` is in there, you can write:

```js
describe('the list of all flavors', () => {
  it('contains lime', () => {
    expect(getAllFlavors()).toContain('lime');
  });
});
```

### `.toEqual(value)`

Use `.toEqual` when you want to check that two objects have the same value. This matcher recursively checks the equality of all fields, rather than checking for object identity. For example, `toEqual` and `toBe` behave differently in this test suite, so all the tests pass:

```js
const can1 = {
  flavor: 'grapefruit',
  ounces: 12,
};
const can2 = {
  flavor: 'grapefruit',
  ounces: 12,
};

describe('the La Croix cans on my desk', () => {
  it('have all the same properties', () => {
    expect(can1).toEqual(can2);
  });
  it('are not the exact same can', () => {
    expect(can1).not.toBe(can2);
  });
});
```

### `.toMatch(regexp)`

Use `.toMatch` to check that a string matches a regular expression.

For example, you might not know what exactly `essayOnTheBestFlavor()` returns, but you know it's a really long string, and the substring `grapefruit` should be in there somewhere. You can test this with:

```js
describe('an essay on the best flavor', () => {
  it('mentions grapefruit', () => {
    expect(essayOnTheBestFlavor()).toMatch(/grapefruit/);
  })
})
```

### `.toMatchSnapshot()`

This ensures that a React component matches the most recent snapshot. Check out [the React + Jest tutorial](https://facebook.github.io/jest/docs/tutorial-react.html) for more information on snapshot testing.

### `.toThrow()`

Use `.toThrow` to test that a function throws when it is called. For example, if we want to test that `drinkFlavor('octopus')` throws, because octopus flavor is too disgusting to drink, we could write:

```js
describe('drinking flavors', () => {
  it('throws on octopus', () => {
    expect(() => {
      drink('octopus');
    }).toThrow();
  });
});
```

If you want to test that a specific error gets thrown, use `.toThrowError`.

### `.toThrowError(error)`

Use `.toThrowError` to test that a function throws a specific error when it
is called. The argument can be a string for the error message, a class for the error, or a regex that should match the error. For example, let's say you have a `drinkFlavor` function that throws whenever the flavor is `'octopus'`, and is coded like this:

```js
function drinkFlavor(flavor) {
  if (flavor == 'octopus') {
    throw new DisgustingFlavorError('yuck, octopus flavor');
  }
  // Do some other stuff
}
```

We could test this error gets thrown in several ways:

```js
describe('drinking flavors', () => {
  it('throws on octopus', () => {
    function drinkOctopus() {
      drink('octopus');
    }
    // Test the exact error message
    expect(drinkOctopus).toThrowError('yuck, octopus flavor');

    // Test that the error message says "yuck" somewhere
    expect(drinkOctopus).toThrowError(/yuck/);

    // Test that we get a DisgustingFlavorError
    expect(drinkOctopus).toThrowError(DisgustingFlavorError);
  });
});
```

If you don't care what specific error gets thrown, use `.toThrow`.

## Mock Functions

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

### `mockFn.mockImplementationOnce(fn)`
Accepts a function that will be used as an implementation of the mock for one call to the mocked function. Can be chained so that multiple function calls produce different results.

```
var myMockFn = jest.fn()
  .mockImplementationOnce(cb => cb(null, true))
  .mockImplementationOnce(cb => cb(null, false));

myMockFn((err, val) => console.log(val));
> true

myMockFn((err, val) => console.log(val));
> false
```

When the mocked function runs out of implementations defined with mockImplementationOnce, it will execute the default implementation set with `jest.fn(() => defaultValue)` or `.mockImplementation(() => defaultValue)` if they were called:

```
var myMockFn = jest.fn(() => 'default')
  .mockImplementationOnce(() => 'first call')
  .mockImplementationOnce(() => 'second call');

console.log(myMockFn(), myMockFn(), myMockFn(), myMockFn());
> 'first call', 'second call', 'default', 'default'
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

## The `jest` object

### `jest.clearAllTimers()`
Removes any pending timers from the timer system.

This means, if any timers have been scheduled (but have not yet executed), they will be cleared and will never have the opportunity to execute in the future.

### `jest.disableAutomock()`
Disables automatic mocking in the module loader.

After this method is called, all `require()`s will return the real versions of each module (rather than a mocked version).

This is usually useful when you have a scenario where the number of dependencies you want to mock is far less than the number of dependencies that you don't. For example, if you're writing a test for a module that uses a large number of dependencies that can be reasonably classified as "implementation details" of the module, then you likely do not want to mock them.

Examples of dependencies that might be considered "implementation details" are things ranging from language built-ins (e.g. Array.prototype methods) to highly common utility methods (e.g. underscore/lo-dash, array utilities etc) and entire libraries like React.js.

*Note: this method was previously called `autoMockOff`. When using `babel-jest`, calls to `disableAutomock` will automatically be hoisted to the top of the code block. Use `autoMockOff` if you want to explicitly avoid this behavior.*

### `jest.enableAutomock()`
Enables automatic mocking in the module loader.

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

### `jest.isMockFunction(fn)`
Determines if the given function is a mocked function.

### `jest.genMockFromModule(moduleName)`
Given the name of a module, use the automatic mocking system to generate a mocked version of the module for you.

This is useful when you want to create a [manual mock](https://facebook.github.io/jest/docs/manual-mocks.html) that extends the automatic mock's behavior.

### `jest.mock(moduleName, ?factory, ?options)`
Mocks a module with an auto-mocked version when it is being required:

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

it('works', () => {
  const sum = require('../sum');
});

it('works too', () => {
  const sum = require('../sum');
  // sum is a different copy of the sum module from the previous test.
});
```

### `jest.runAllTicks()`
Exhausts the **micro**-task queue (usually interfaced in node via `process.nextTick`).

When this API is called, all pending micro-tasks that have been queued via `process.nextTick` will be executed. Additionally, if those micro-tasks themselves schedule new micro-tasks, those will be continually exhausted until there are no more micro-tasks remaining in the queue.

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

### `jest.useFakeTimers()`
Instructs Jest to use fake versions of the standard timer functions (`setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `nextTick`, `setImmediate` and `clearImmediate`).

### `jest.useRealTimers()`
Instructs Jest to use the real versions of the standard timer functions.

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
(default: false)

This option is disabled by default. If you are introducing Jest to a large organization with an existing codebase but few tests, enabling this option can be helpful to introduce unit tests gradually. Modules can be explicitly auto-mocked using `jest.mock(moduleName)`.

### `browser` [boolean]
(default: false)

Respect the Browserify's [`"browser"`](https://github.com/substack/browserify-handbook#browser-field) field in `package.json` when resolving modules. Some modules export different versions based on whether they are operating in Node or a browser.

### `bail` [boolean]
(default: false)

By default, Jest runs all tests and produces all errors into the console upon completion. The bail config option can be used here to have Jest stop running tests after the first failure.

### `cacheDirectory` [string]
(default: '/tmp/<path>')

The directory where Jest should store its cached dependency information.

Jest attempts to scan your dependency tree once (up-front) and cache it in order to ease some of the filesystem raking that needs to happen while running tests. This config option lets you customize where Jest stores that cache data on disk.

### `coverageDirectory` [string]
(default: `undefined`)

The directory where Jest should output its coverage files.

### `collectCoverage` [boolean]
(default: `false`)

Indicates whether the coverage information should be collected while executing the test. Because this retrofits all executed files with coverage collection statements, it may significantly slow down your tests.

### `collectCoverageOnlyFrom` [object]
(default: `undefined`)

An object that, when present, indicates a set of files for which coverage information should be collected. Any files not present in this set will not have coverage collected for them. Since there is a performance cost for each file that we collect coverage information from, this can help prune this cost down to only the files in which you care about coverage (such as the specific modules that you are testing).

### `coveragePathIgnorePatterns` [array<string>]
(default: `['/node_modules/']`)

An array of regexp pattern strings that are matched against all file paths before executing the test. If the file path matches any of the patterns, coverage information will be skipped.

These pattern strings match against the full path. Use the `<rootDir>` string token to  include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories. Example: `['<rootDir>/build/', '<rootDir>/node_modules/']`.

### `coverageThreshold` [object]
(default: `undefined`)

This will be used to configure minimum threshold enforcement for coverage results. If the thresholds are not met, jest will return failure. Thresholds, when specified as a positive number are taken to be the minimum percentage required. When a threshold is specified as a negative number it represents the maximum number of uncovered entities allowed.

For example, statements: 90 implies minimum statement coverage is 90%. statements: -10 implies that no more than 10 uncovered statements are allowed.

```js
{
  ...
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 50,
        "functions": 50,
        "lines": 50,
        "statements": 50
      }
    }
  }
}
```

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

These pattern strings match against the full path. Use the `<rootDir>` string token to  include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories. Example: `['<rootDir>/build/']`.

### `modulePaths` [array<string>]
(default: `[]`)

An alternative API to setting the `NODE_PATH` env variable, `modulePaths` is an array of absolute paths to
additional locations to search when resolving modules.

### `moduleDirectories` [array<string>]
(default: `['node_modules']`)

An array of directory names to be searched recursively up from the requiring module's location. Setting this option
will _override_ the default, if you wish to still search `node_modules` for packages include it
along with any other options: `['node_modules', 'bower_components']`

### `moduleNameMapper` [object<string, string>]
(default: `null`)

A map from regular expressions to module names that allow to stub out resources, like images or styles with a single module.

Modules that are mapped to an alias are unmocked by default, regardless of whether automocking is enabled or not.

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

### `notify` [boolean]
(default: `false`)

Activates notifications for test results.

### `preset` [string]
(default: `undefined`)

A preset that is used as a base for Jest's configuration. A preset should point to an npm module that exports a `jest-preset.json` module on its top level.

### `resetModules` [boolean]
(default: `false`)

If enabled, the module registry for every test file will be reset before running each individual test. This is useful to isolate modules for every test so that local module state doesn't conflict between tests. This can be done programmatically using [`jest.resetModules()`](https://facebook.github.io/jest/docs/api.html#jest-resetmodules).

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
(default: `['/node_modules/']`)

An array of regexp pattern strings that are matched against all source file paths before preprocessing. If the test path matches any of the patterns, it will not be preprocessed.

These pattern strings match against the full path. Use the `<rootDir>` string token to  include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories. Example: `['<rootDir>/bower_components/', '<rootDir>/node_modules/']`.

*Note: if this option is not specified by the user and Jest detects the project as a [react-native](https://github.com/facebook/react-native) project, it will ignore the default and process every file. It is common on react-native projects to ship npm modules without pre-compiling JavaScript.*

### `setupFiles` [array]
(default: `[]`)

The paths to modules that run some code to configure or set up the testing environment before each test. Since every test runs in its own environment, these scripts will be executed in the testing environment immediately before executing the test code itself.

It's worth noting that this code will execute *before* [`setupTestFrameworkScriptFile`](https://facebook.github.io/jest/docs/api.html#setuptestframeworkscriptfile-string).

### `setupTestFrameworkScriptFile` [string]
(default: `undefined`)

The path to a module that runs some code to configure or set up the testing framework before each test. Since [`setupFiles`](https://facebook.github.io/jest/docs/api.html#setupfiles-array) executes before the test framework is installed in the environment, this script file presents you the opportunity of running some code immediately after the test framework has been installed in the environment.

For example, Jest ships with several plug-ins to `jasmine` that work by monkey-patching the jasmine API. If you wanted to add even more jasmine plugins to the mix (or if you wanted some custom, project-wide matchers for example), you could do so in this module.

### `testEnvironment` [string]
(default: `'jsdom'`)

The test environment that will be used for testing. The default environment in Jest is a browser-like environment through [jsdom](https://github.com/tmpvar/jsdom). If you are building a node service, you can use the `node` option to use a node-like environment instead.

### `testPathDirs` [array<string>]
(default: `['<rootDir>']`)

A list of paths to directories that Jest should use to search for tests in.

There are times where you only want Jest to search in a single sub-directory (such as cases where you have a `src/` directory in your repo), but not the rest of the repo.

### `testPathIgnorePatterns` [array<string>]
(default: `['/node_modules/']`)

An array of regexp pattern strings that are matched against all test paths before executing the test. If the test path matches any of the patterns, it will be skipped.

These pattern strings match against the full path. Use the `<rootDir>` string token to  include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories. Example: `['<rootDir>/build/', '<rootDir>/node_modules/']`.

### `testPathPattern` [string]
(default: `/.*/`) - See notes below for more details on the default setting.

A regexp pattern string that is matched against all test paths before executing the test. If the test path does not match the pattern, it will be skipped.

This is useful if you need to override the default. If you are testing one file at a time the default will be set to `/.*/`, however if you pass a blob rather than a single file the default will then be the absolute path of each test file. The override may be needed on windows machines where, for example, the test full path would be `C:/myproject/__tests__/mystest.jsx.jest` and the default pattern would be set as `/C:\myproject\__tests__\mystest.jsx.jest/`.

### `testRegex` [string]
(default: `(/__tests__/.*|\\.(test|spec))\\.js$`)

The pattern Jest uses to detect test files. By default it looks for `.js` files
inside of `__tests__` folders.

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

## Miscellaneous

### `check`

Jest supports property testing with the
[testcheck-js](https://github.com/leebyron/testcheck-js) library. The API is
the same as that of [jasmine-check](https://github.com/leebyron/jasmine-check):

### `check.it(name, [options], generators, fn)`
Creates a property test. Test cases will be created by the given `generators`
and passed as arguments to `fn`. If any test case fails, a shrunken failing
value will be given in the test output. For example:

```js
const { check, gen } = require('jest-check');

check.it('can recover encoded URIs',
  [gen.string],
  s => expect(s).toBe(decodeURI(encodeURI(s))));
```

If `options` are provided, they override the corresponding command-line options.
The possible options are:

```
{
  times: number;   // The number of test cases to run. Default: 100.
  maxSize: number; // The maximum size of sized data such as numbers
                   // (their magnitude) or arrays (their length). This can be
                   // overridden with `gen.resize`. Default: 200.
  seed: number;    // The random number seed. Defaults to a random value.
}
```

### `check.fit(name, [options], generators, fn)`

Executes this test and skips all others. Like `fit`, but for property tests.

### `check.xit(name, [options], generators, fn)`

Skips this test. Like `xit`, but for property tests.

### `gen`

A library of generators for property tests. See the
[`testcheck` documentation](https://github.com/leebyron/testcheck-js).
<generated_api_end />
