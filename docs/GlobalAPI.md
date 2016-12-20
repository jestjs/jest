---
id: api
title: Globals
layout: docs
category: API Reference
permalink: docs/api.html
next: expect
---

In your test files, Jest puts each of these methods and objects into the global environment. You don't have to require or import anything to use them.

  - `afterAll(fn)`
  - `afterEach(fn)`
  - `beforeAll(fn)`
  - `beforeEach(fn)`
  - [`describe(name, fn)`](#basic-testing)
  - `fdescribe(name, fn)`
  - `fit(name, fn)` executes only this test. Useful when investigating a failure
  - [`it(name, fn)`](#basic-testing)
  - [`it.only(name, fn)`](#basic-testing)
  - [`it.skip(name, fn)`](#basic-testing)
  - [`require.requireActual(moduleName)`](#requirerequireactualmodulename)
  - [`require.requireMock(moduleName)`](#requirerequiremockmodulename)
  - [`test(name, fn)`](#basic-testing) is an alias for `it`
  - `xdescribe(name, fn)`
  - `xit(name, fn)`
  - `xtest(name, fn)`

-----

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
