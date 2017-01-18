---
id: api
title: API Reference
layout: docs
category: Reference
permalink: docs/api.html
next: configuration
---

#### The Jest global environment

In your test files, Jest puts each of these methods and objects into the global environment. You don't have to require or import anything to use them.

  - `afterEach(fn)`
  - `beforeEach(fn)`
  - `afterAll(fn)`
  - `beforeAll(fn)`
  - [`describe(name, fn)`](#basic-testing)
  - [`expect(value)`](#expectvalue)
  - [`expect.extend(matchers)`](#extending-jest-matchers)
  - [`expect.assertions(number)`](#expecting-a-certain-number-of-assertions)
  - [`expect.<asymmetric-match>()`](#asymmetric-jest-matchers)
  - [`it(name, fn)`](#basic-testing)
  - [`it.only(name, fn)`](#basic-testing)
  - [`it.skip(name, fn)`](#basic-testing)
  - `fit(name, fn)` executes only this test. Useful when investigating a failure
  - [`jest`](#the-jest-object)
  - [`require.requireActual(moduleName)`](#requirerequireactualmodulename)
  - [`require.requireMock(moduleName)`](#requirerequiremockmodulename)
  - [`test(name, fn)`](#basic-testing) is an alias for `it`
  - `xdescribe(name, fn)`
  - `fdescribe(name, fn)`
  - `xit(name, fn)`
  - `xtest(name, fn)`

#### Writing assertions with `expect`

When you're writing tests, you need to check that values are what you
expect all the time. That's what you use `expect` for.

  - [`expect(value)`](#expectvalue)
  - `.lastCalledWith(arg1, arg2, ...)` is an alias for [`.toHaveBeenLastCalledWith(arg1, arg2, ...)`](#tohavebeenlastcalledwitharg1-arg2-)
  - [`.not`](#not)
  - [`.toBe(value)`](#tobevalue)
  - `.toBeCalled()` is an alias for [`.toHaveBeenCalled()`](#tohavebeencalled)
  - `.toBeCalledWith(arg1, arg2, ...)` is an alias for [`.toHaveBeenCalledWith(arg1, arg2, ...)`](#tohavebeencalledwitharg1-arg2-)
  - [`.toHaveBeenCalled()`](#tohavebeencalled)
  - [`.toHaveBeenCalledTimes(number)`](#tohavebeencalledtimesnumber)
  - [`.toHaveBeenCalledWith(arg1, arg2, ...)`](#tohavebeencalledwitharg1-arg2-)
  - [`.toHaveBeenLastCalledWith(arg1, arg2, ...)`](#tohavebeenlastcalledwitharg1-arg2-)
  - [`.toBeCloseTo(number, numDigits)`](#tobeclosetonumber-numdigits)
  - [`.toBeDefined()`](#tobedefined)
  - [`.toBeFalsy()`](#tobefalsy)
  - [`.toBeGreaterThan(number)`](#tobegreaterthannumber)
  - [`.toBeGreaterThanOrEqual(number)`](#tobegreaterthanorequalnumber)
  - [`.toBeLessThan(number)`](#tobelessthannumber)
  - [`.toBeLessThanOrEqual(number)`](#tobelessthanorequalnumber)
  - [`.toBeInstanceOf(Class)`](#tobeinstanceofclass)
  - [`.toBeNull()`](#tobenull)
  - [`.toBeTruthy()`](#tobetruthy)
  - [`.toBeUndefined()`](#tobeundefined)
  - [`.toContain(item)`](#tocontainitem)
  - [`.toContainEqual(item)`](#tocontainequalitem)
  - [`.toEqual(value)`](#toequalvalue)
  - [`.toHaveLength(number)`](#tohavelengthnumber)
  - [`.toMatch(regexp)`](#tomatchregexp)
  - [`.toMatchObject(object)`](#tomatchobjectobject)
  - [`.toMatchSnapshot()`](#tomatchsnapshot)
  - [`.toThrow()`](#tothrow)
  - [`.toThrowError(error)`](#tothrowerrorerror)
  - [`.toThrowErrorMatchingSnapshot()`](#tothrowerrormatchingsnapshot)

#### Mock functions

Mock functions are also known as "spies", because they let you spy on the behavior of a function that is called indirectly by some other code, rather than just testing the output. You can create a mock function with `jest.fn()`.

  - [`mockFn.mock.calls`](#mockfnmockcalls)
  - [`mockFn.mock.instances`](#mockfnmockinstances)
  - [`mockFn.mockClear()`](#mockfnmockclear)
  - [`mockFn.mockReset()`](#mockfnmockreset)
  - [`mockFn.mockImplementation(fn)`](#mockfnmockimplementationfn)
  - [`mockFn.mockImplementationOnce(fn)`](#mockfnmockimplementationoncefn)
  - [`mockFn.mockReturnThis()`](#mockfnmockreturnthis)
  - [`mockFn.mockReturnValue(value)`](#mockfnmockreturnvaluevalue)
  - [`mockFn.mockReturnValueOnce(value)`](#mockfnmockreturnvalueoncevalue)

#### The `jest` object

These methods help create mocks and let you control Jest's overall behavior.

  - [`jest.resetAllMocks()`](#jestresetallmocks)
  - [`jest.clearAllTimers()`](#jestclearalltimers)
  - [`jest.disableAutomock()`](#jestdisableautomock)
  - [`jest.enableAutomock()`](#jestenableautomock)
  - [`jest.fn(?implementation)`](#jestfnimplementation)
  - [`jest.isMockFunction(fn)`](#jestismockfunctionfn)
  - [`jest.genMockFromModule(moduleName)`](#jestgenmockfrommodulemodulename)
  - [`jest.mock(moduleName, ?factory, ?options)`](#jestmockmodulename-factory-options)
  - [`jest.resetModules()`](#jestresetmodules)
  - [`jest.runAllTicks()`](#jestrunallticks)
  - [`jest.runAllTimers()`](#jestrunalltimers)
  - [`jest.runTimersToTime(msToRun)`](#jestruntimerstotimemstorun)
  - [`jest.runOnlyPendingTimers()`](#jestrunonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](#jestsetmockmodulename-moduleexports)
  - [`jest.unmock(moduleName)`](#jestunmockmodulename)
  - [`jest.useFakeTimers()`](#jestusefaketimers)
  - [`jest.useRealTimers()`](#jestuserealtimers)

### The Jest CLI

  - [Jest CLI Options](#jest-cli-options)

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
});
```

To test an asynchronous function, just return a promise from `it`. When running tests, Jest will wait for the promise to resolve before letting the test complete.

You can also return a promise from `beforeEach`, `afterEach`, `beforeAll` or `afterAll` functions.

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

You can use `.only` if you want to run only one test or describe block:

```js
describe.only('my beverage', () => {
  it('is delicious', () => {
    expect(myBeverage.delicious).toBeTruthy();
  });

  it('is not sour', () => {
    expect(myBeverage.sour).toBeFalsy();
  });
});

describe('my other beverage', () => {
  // ... will be skipped
});
```

or

```js
it.only('will run', () => { /* ... */ });
it('will be skipped', () => { /* ... */ });
```

Or you can use `.skip` if you want to skip a test or a describe block:
```js
it.skip('will be skipped', () => { /* ... */ });
it('will run', () => { /* ... */ });
```

Alternatively you can use `test` instead of `it`. `test` is just an alias for `it` and
works exactly the same.
```js
test('something works', () => { /* ... */ });
test.skip('this test is skipped', () => { /* ... */ });
test.only('this test will run');
```

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

### `.toHaveBeenCalled()`

Use `.toHaveBeenCalled` to ensure that a mock function got called.

For example, let's say you have a `drinkAll(drink, flavor)` function that takes a `drink` function and applies it to all available beverages. You might want to check that `drink` gets called for `'lemon'`, but not for `'octopus'`, because `'octopus'` flavor is really weird and why would anything be octopus-flavored? You can do that with this test suite:

```js
describe('drinkAll', () => {
  it('drinks something lemon-flavored', () => {
    let drink = jest.fn();
    drinkAll(drink, 'lemon');
    expect(drink).toHaveBeenCalled();
  });

  it('does not drink something octopus-flavored', () => {
    let drink = jest.fn();
    drinkAll(drink, 'octopus');
    expect(drink).not.toHaveBeenCalled();
  });
});
```

### `.toHaveBeenCalledTimes(number)`

Use `.toHaveBeenCalledTimes` to ensure that a mock function got called exact number of times.

For example, let's say you have a `drinkEach(drink, Array<flavor>)` function that takes a `drink` function and applies it to array of passed beverages. You might want to check that drink function was called exact number of times. You can do that with this test suite:

```js
describe('drinkEach', () => {
  it('drinks each drink', () => {
    let drink = jest.fn();
    drinkEach(drink, ['lemon', 'octopus']);
    expect(drink).toHaveBeenCalledTimes(2);
  });
});
```

### `.toHaveBeenCalledWith(arg1, arg2, ...)`

Use `.toHaveBeenCalledWith` to ensure that a mock function was called with specific
arguments.

For example, let's say that you can register a beverage with a `register` function, and `applyToAll(f)` should apply the function `f` to all registered beverages. To make sure this works, you could write:

```js
describe('beverage registration', () => {
  it('applies correctly to orange La Croix', () => {
    let beverage = new LaCroix('orange');
    register(beverage);
    let f = jest.fn();
    applyToAll(f);
    expect(f).toHaveBeenCalledWith(beverage);
  });
});
```

### `.toHaveBeenLastCalledWith(arg1, arg2, ...)`

If you have a mock function, you can use `.toHaveBeenLastCalledWith` to test what arguments it was last called with. For example, let's say you have a `applyToAllFlavors(f)` function that applies `f` to a bunch of flavors, and you want to ensure that when you call it, the last flavor it operates on is `'mango'`. You can write:

```js
describe('applying to all flavors', () => {
  it('does mango last', () => {
    let drink = jest.fn();
    applyToAllFlavors(drink);
    expect(drink).toHaveBeenLastCalledWith('mango');
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
    expect(ouncesPerCan()).toBeLessThan(20);
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

### `.toBeInstanceOf(Class)`

Use `.toBeInstanceOf(Class)` to check that an object is an instance of a class. This matcher uses `instanceof` underneath.

```js
class A {}

expect(new A()).toBeInstanceOf(A);
expect(() => {}).toBeInstanceOf(Function);
expect(new A()).toBeInstanceOf(Function); // throws
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

### `.toContainEqual(item)`

Use `.toContainEqual` when you want to check that an item is in a list.
For testing the items in the list, this  matcher recursively checks the equality of all fields, rather than checking for object identity.

```js
describe('my beverage', () => {
  it('is delicious and not sour', () => {
    const myBeverage = {delicious: true, sour: false};
    expect(myBeverages()).toContainEqual(myBeverage);
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

### `.toHaveLength(number)`

Use `.toHaveLength` to check that an object has a `.length` property and it is set to a certain numeric value.

This is especially useful for checking arrays or strings size.

```js
expect([1, 2, 3]).toHaveLength(3);
expect('abc').toHaveLength(3);
expect('').not.toHaveLength(5);
```

### `.toMatch(regexp)`

Use `.toMatch` to check that a string matches a regular expression.

For example, you might not know what exactly `essayOnTheBestFlavor()` returns, but you know it's a really long string, and the substring `grapefruit` should be in there somewhere. You can test this with:

```js
describe('an essay on the best flavor', () => {
  it('mentions grapefruit', () => {
    expect(essayOnTheBestFlavor()).toMatch(/grapefruit/);
    expect(essayOnTheBestFlavor()).toMatch(new RegExp('grapefruit'));
  })
})
```

This matcher also accepts a string, which it will try to match:

```js
describe('grapefruits are healthy', () => {
  it('grapefruits are a fruit', () => {
    expect('grapefruits').toMatch('fruit');
  })
})
```

### `.toMatchObject(object)`

Use `.toMatchObject` to check that a javascript object matches a subset of the properties of an object.

```js
const houseForSale = {
	bath: true,
	kitchen: {
		amenities: ['oven', 'stove', 'washer'],
		area: 20,
		wallColor: 'white'
	},
  bedrooms: 4
};
const desiredHouse = {
	bath: true,
	kitchen: {
		amenities: ['oven', 'stove', 'washer'],
		wallColor: 'white'
	}
};

describe('looking for a new house', () => {
	it('the house has my desired features', () => {
		expect(houseForSale).toMatchObject(desiredHouse);
	});
});
```


### `.toMatchSnapshot(?string)`

This ensures that a value matches the most recent snapshot. Check out [the React + Jest tutorial](https://facebook.github.io/jest/docs/tutorial-react.html) for more information on snapshot testing.

You can also specify an optional snapshot name. Otherwise, the name is inferred
from the test.

*Note: While snapshot testing is most commonly used with React components, any
serializable value can be used as a snapshot.*

### `.toThrow()`

Use `.toThrow` to test that a function throws when it is called. For example, if we want to test that `drinkFlavor('octopus')` throws, because octopus flavor is too disgusting to drink, we could write:

```js
describe('drinking flavors', () => {
  it('throws on octopus', () => {
    expect(() => {
      drinkFlavor('octopus');
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
      drinkFlavor('octopus');
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

### `.toThrowErrorMatchingSnapshot()`

Use `.toThrowErrorMatchingSnapshot` to test that a function throws a error matching the most recent snapshot when it is called. For example, let's say you have a `drinkFlavor` function that throws whenever the flavor is `'octopus'`, and is coded like this:

```js
function drinkFlavor(flavor) {
  if (flavor == 'octopus') {
    throw new DisgustingFlavorError('yuck, octopus flavor');
  }
  // Do some other stuff
}
```

The test for this function will look this way:

```js
describe('drinking flavors', () => {
  it('throws on octopus', () => {
    function drinkOctopus() {
      drinkFlavor('octopus');
    }

    expect(drinkOctopus).toThrowErrorMatchingSnapshot();
  });
});
```

And it will generate the following snapshot:

```
exports[`drinking flavors throws on octopus 1`] = `"yuck, octopus flavor"`;
```

Check out [React Tree Snapshot Testing](http://facebook.github.io/jest/blog/2016/07/27/jest-14.html) for more information on snapshot testing.


### Extending Jest Matchers

Using descriptive matchers will help your tests be readable and maintainable. Jest has a simple API for adding your own matchers. Here is an example of adding a matcher:

```js
const five = require('five');

expect.extend({
  toBeNumber(received, actual) {
    const pass = received === actual;
    const message =
      () => `expected ${received} ${pass ? 'not ' : ''} to be ${actual}`;
    return {message, pass};
  }
});

describe('toBe5', () => {
  it('matches the number 5', () => {
    expect(five()).toBeNumber(5);
    expect('Jest').not.toBeNumber(5);
  });
});
```

Jest will give your matchers context to simplify coding. The following can be found on `this` inside a custom matcher:

#### `this.isNot`

A boolean to let you know this matcher was called with the negated `.not` modifier allowing you to flip your assertion.

#### `this.utils`

There are a number of helpful tools exposed on `this.utils` primarily consisting of the exports from [`jest-matcher-utils`](https://github.com/facebook/jest/tree/master/packages/jest-matcher-utils).

The most useful ones are `matcherHint`, `printExpected` and `printReceived` to format the error messages nicely. For example, take a look at the implementation for the `toBe` matcher:

```js
const diff = require('jest-diff');
expect.extend({
  toBe(received, expected) {
    const pass = received === expected;

    const message = pass
      ? () => this.utils.matcherHint('.not.toBe') + '\n\n' +
        `Expected value to not be (using ===):\n` +
        `  ${this.utils.printExpected(expected)}\n` +
        `Received:\n` +
        `  ${this.utils.printReceived(received)}`
      : () => {
        const diffString = diff(expected, received, {
          expand: this.expand,
        });
        return this.utils.matcherHint('.toBe') + '\n\n' +
        `Expected value to be (using ===):\n` +
        `  ${this.utils.printExpected(expected)}\n` +
        `Received:\n` +
        `  ${this.utils.printReceived(received)}` +
        (diffString ? `\n\nDifference:\n\n${diffString}` : '');
      };

    return {actual: received, message, pass};
  },
});
```

This will print something like this:

```
  expect(received).toBe(expected)

    Expected value to be (using ===):
      "banana"
    Received:
      "apple"
```

When an assertion fails, the error message should give as much signal as necessary to the user so they can resolve their issue quickly. It's usually recommended to spend a lot of time crafting a great failure message to make sure users of your custom assertions have a good developer experience.

### Asymmetric Jest Matchers

Sometimes you don't want to check equality of entire object. You just need to assert that value is not empty or has some expected type. For example, we want to check the shape of some message entity:

```
  expect({
    timestamp: 1480807810388,
    text: 'Some text content, but we care only about *this part*'
  }).toEqual({
    timestamp: expect.any(Number),
    text: expect.stringMatching('*this part*')
  });
```

There some special values with specific comparing behavior that you can use as a part of expectation. They are useful for asserting some types of data, like timestamps, or long text resources, where only part of it is important for testing. Currently, Jest has the following asymmetric matches:

  * `expect.anything()` - matches everything, except `null` and `undefined`
  * `expect.any(<constructor>)` - checks, that actual value is instance of provided `<constructor>`.
  * `expect.objectContaining(<object>)` - compares only keys, that exist in provided object. All other keys of `actual` value will be ignored.
  * `expect.arrayContaining(<array>)` - checks that all items from the provided `array` are exist in `actual` value. It allows to have more values in `actual`.
  * `expect.stringMatching(<string|Regexp>)` - checks that actual value has matches of provided expectation.

These expressions can be used as an argument in `.toEqual` and `.toBeCalledWith`:

```
  expect(callback).toEqual(expect.any(Function));

  expect(mySpy).toBeCalledWith(expect.any(Number), expect.any(String))
```

They can be also used as object keys and may be nested into each other:

```
  expect(myObject).toEqual(expect.objectContaining({
    items: expect.arrayContaining([
      expect.any(Number)
    ])
  }));
```

The example above will match the following object. Array may contain more items, as well as object itself may also have some extra keys:

```
{
  items: [1]
}
```

## Expecting a certain number of assertions

`expect.assertions(number)` configures a test to expect a specific
number of assertions:

```
  it('passes parameters to a callback', function() {
    expect.assertions(1);

    var emitter = new EventEmitter();

    emitter.on('consume', function(phrase) {
      expect(phrase).toEqual('bubbly water');
    });

    emitter.emit('consume', 'bubbly water');
  });
```

This is useful for preventing false positives: tests where an
assertion may not execute. In the test above, if the event emitter
fails to invoke the callback, no assertions will run. Without
`expect.assertions`, the test would otherwise incorrectly pass.

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
Resets all information stored in the [`mockFn.mock.calls`](#mockfn-mock-calls) and [`mockFn.mock.instances`](#mockfn-mock-instances) arrays.

Often this is useful when you want to clean up a mock's usage data between two assertions.

### `mockFn.mockReset()`
Resets all information stored in the mock

This is useful when you want to completely restore a mock back to its initial state.

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

### `jest.resetAllMocks()`
Resets the state of all mocks. Equivalent to calling `.mockReset()` on every mocked function.

Returns the `jest` object for chaining.

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

### `jest.fn(?implementation)`
Returns a new, unused [mock function](#mock-functions). Optionally takes a mock
implementation.

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

it('works', () => {
  const sum = require('../sum');
});

it('works too', () => {
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

*Note It is recommended to use [`jest.mock()`](#jest-mock-modulename-factory) instead. The `jest.mock` API's second argument is a module factory instead of the expected exported module object.*

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


### Jest CLI options

Run `jest --help` to view the various options available.

It is possible to run test suites by providing a pattern. Only the files that the pattern matches will be picked up and executed.

If you have a test suite in a file named `Component-snapshot-test.js` somewhere in the file hierarchy, you can run only that test by adding a pattern right after the `jest` command:

```bash
jest Component-snapshot
```

It is possible to further limit the tests that will be run by using the `--testNamePattern` (or simply `-t`) flag.

```bash
jest Component-snapshot -t "is selected"
```

It is possible to combine the `--updateSnapshot` (`-u`) flag with the options above in order to re-record snapshots for particular test suites or tests only:

Update snapshots for all files matching the pattern:
```bash
jest -u Component-snapshot
```

Only update snapshots for tests matching the pattern:
```bash
jest -u Component-snapshot -t "is selected"
```

It is possible to specify which files the coverage report will be generated for.

```bash
jest --collectCoverageFrom='["packages/**/index.js", "!**/vendor/**"]' --coverage
```
