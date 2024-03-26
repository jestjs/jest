---
id: api
title: Globals
---

In your test files, Jest puts each of these methods and objects into the global environment. You don't have to require or import anything to use them. However, if you prefer explicit imports, you can do `import {describe, expect, test} from '@jest/globals'`.

import TypeScriptExamplesNote from './_TypeScriptExamplesNote.md';

<TypeScriptExamplesNote />

## Methods

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(1)} />

---

## Reference

### `afterAll(fn, timeout)`

Runs a function after all the tests in this file have completed. If the function returns a promise or is a generator, Jest waits for that promise to resolve before continuing.

Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait before aborting. The default timeout is 5 seconds.

This is often useful if you want to clean up some global setup state that is shared across tests.

For example:

```js
const globalDatabase = makeGlobalDatabase();

function cleanUpDatabase(db) {
  db.cleanUp();
}

afterAll(() => {
  cleanUpDatabase(globalDatabase);
});

test('can find things', () => {
  return globalDatabase.find('thing', {}, results => {
    expect(results.length).toBeGreaterThan(0);
  });
});

test('can insert a thing', () => {
  return globalDatabase.insert('thing', makeThing(), response => {
    expect(response.success).toBeTruthy();
  });
});
```

Here the `afterAll` ensures that `cleanUpDatabase` is called after all tests run.

If `afterAll` is inside a `describe` block, it runs at the end of the describe block.

If you want to run some cleanup after every test instead of after all tests, use `afterEach` instead.

### `afterEach(fn, timeout)`

Runs a function after each one of the tests in this file completes. If the function returns a promise or is a generator, Jest waits for that promise to resolve before continuing.

Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait before aborting. The default timeout is 5 seconds.

This is often useful if you want to clean up some temporary state that is created by each test.

For example:

```js
const globalDatabase = makeGlobalDatabase();

function cleanUpDatabase(db) {
  db.cleanUp();
}

afterEach(() => {
  cleanUpDatabase(globalDatabase);
});

test('can find things', () => {
  return globalDatabase.find('thing', {}, results => {
    expect(results.length).toBeGreaterThan(0);
  });
});

test('can insert a thing', () => {
  return globalDatabase.insert('thing', makeThing(), response => {
    expect(response.success).toBeTruthy();
  });
});
```

Here the `afterEach` ensures that `cleanUpDatabase` is called after each test runs.

If `afterEach` is inside a `describe` block, it only runs after the tests that are inside this describe block.

If you want to run some cleanup just once, after all of the tests run, use `afterAll` instead.

### `beforeAll(fn, timeout)`

Runs a function before any of the tests in this file run. If the function returns a promise or is a generator, Jest waits for that promise to resolve before running tests.

Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait before aborting. The default timeout is 5 seconds.

This is often useful if you want to set up some global state that will be used by many tests.

For example:

```js
const globalDatabase = makeGlobalDatabase();

beforeAll(() => {
  // Clears the database and adds some testing data.
  // Jest will wait for this promise to resolve before running tests.
  return globalDatabase.clear().then(() => {
    return globalDatabase.insert({testData: 'foo'});
  });
});

// Since we only set up the database once in this example, it's important
// that our tests don't modify it.
test('can find things', () => {
  return globalDatabase.find('thing', {}, results => {
    expect(results.length).toBeGreaterThan(0);
  });
});
```

Here the `beforeAll` ensures that the database is set up before tests run. If setup was synchronous, you could do this without `beforeAll`. The key is that Jest will wait for a promise to resolve, so you can have asynchronous setup as well.

If `beforeAll` is inside a `describe` block, it runs at the beginning of the describe block.

If you want to run something before every test instead of before any test runs, use `beforeEach` instead.

### `beforeEach(fn, timeout)`

Runs a function before each of the tests in this file runs. If the function returns a promise or is a generator, Jest waits for that promise to resolve before running the test.

Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait before aborting. The default timeout is 5 seconds.

This is often useful if you want to reset some global state that will be used by many tests.

For example:

```js
const globalDatabase = makeGlobalDatabase();

beforeEach(() => {
  // Clears the database and adds some testing data.
  // Jest will wait for this promise to resolve before running tests.
  return globalDatabase.clear().then(() => {
    return globalDatabase.insert({testData: 'foo'});
  });
});

test('can find things', () => {
  return globalDatabase.find('thing', {}, results => {
    expect(results.length).toBeGreaterThan(0);
  });
});

test('can insert a thing', () => {
  return globalDatabase.insert('thing', makeThing(), response => {
    expect(response.success).toBeTruthy();
  });
});
```

Here the `beforeEach` ensures that the database is reset for each test.

If `beforeEach` is inside a `describe` block, it runs for each test in the describe block.

If you only need to run some setup code once, before any tests run, use `beforeAll` instead.

### `describe(name, fn)`

`describe(name, fn)` creates a block that groups together several related tests. For example, if you have a `myBeverage` object that is supposed to be delicious but not sour, you could test it with:

```js
const myBeverage = {
  delicious: true,
  sour: false,
};

describe('my beverage', () => {
  test('is delicious', () => {
    expect(myBeverage.delicious).toBeTruthy();
  });

  test('is not sour', () => {
    expect(myBeverage.sour).toBeFalsy();
  });
});
```

This isn't required - you can write the `test` blocks directly at the top level. But this can be handy if you prefer your tests to be organized into groups.

You can also nest `describe` blocks if you have a hierarchy of tests:

```js
const binaryStringToNumber = binString => {
  if (!/^[01]+$/.test(binString)) {
    throw new CustomError('Not a binary number.');
  }

  return parseInt(binString, 2);
};

describe('binaryStringToNumber', () => {
  describe('given an invalid binary string', () => {
    test('composed of non-numbers throws CustomError', () => {
      expect(() => binaryStringToNumber('abc')).toThrow(CustomError);
    });

    test('with extra whitespace throws CustomError', () => {
      expect(() => binaryStringToNumber('  100')).toThrow(CustomError);
    });
  });

  describe('given a valid binary string', () => {
    test('returns the correct number', () => {
      expect(binaryStringToNumber('100')).toBe(4);
    });
  });
});
```

### `describe.each(table)(name, fn, timeout)`

Use `describe.each` if you keep duplicating the same test suites with different data. `describe.each` allows you to write the test suite once and pass data in.

`describe.each` is available with two APIs:

#### 1. `describe.each(table)(name, fn, timeout)`

- `table`: `Array` of Arrays with the arguments that are passed into the `fn` for each row. If you pass in a 1D array of primitives, internally it will be mapped to a table i.e. `[1, 2, 3] -> [[1], [2], [3]]`.

- `name`: `String` the title of the test suite.
  - Generate unique test titles by positionally injecting parameters with [`printf` formatting](https://nodejs.org/api/util.html#util_util_format_format_args):
    - `%p` - [pretty-format](https://www.npmjs.com/package/pretty-format).
    - `%s`- String.
    - `%d`- Number.
    - `%i` - Integer.
    - `%f` - Floating point value.
    - `%j` - JSON.
    - `%o` - Object.
    - `%#` - Index of the test case.
    - `%$` - Number of the test case.
    - `%%` - single percent sign ('%'). This does not consume an argument.
  - Or generate unique test titles by injecting properties of test case object with `$variable`
    - To inject nested object values use you can supply a keyPath i.e. `$variable.path.to.value`
    - You can use `$#` to inject the index of the test case
    - You cannot use `$variable` with the `printf` formatting except for `%%`
- `fn`: `Function` the suite of tests to be run, this is the function that will receive the parameters in each row as function arguments.
- Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.

Example:

```js
describe.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  test(`returns ${expected}`, () => {
    expect(a + b).toBe(expected);
  });

  test(`returned value not be greater than ${expected}`, () => {
    expect(a + b).not.toBeGreaterThan(expected);
  });

  test(`returned value not be less than ${expected}`, () => {
    expect(a + b).not.toBeLessThan(expected);
  });
});
```

```js
describe.each([
  {a: 1, b: 1, expected: 2},
  {a: 1, b: 2, expected: 3},
  {a: 2, b: 1, expected: 3},
])('.add($a, $b)', ({a, b, expected}) => {
  test(`returns ${expected}`, () => {
    expect(a + b).toBe(expected);
  });

  test(`returned value not be greater than ${expected}`, () => {
    expect(a + b).not.toBeGreaterThan(expected);
  });

  test(`returned value not be less than ${expected}`, () => {
    expect(a + b).not.toBeLessThan(expected);
  });
});
```

#### 2. ``describe.each`table`(name, fn, timeout)``

- `table`: `Tagged Template Literal`
  - First row of variable name column headings separated with `|`
  - One or more subsequent rows of data supplied as template literal expressions using `${value}` syntax.
- `name`: `String` the title of the test suite, use `$variable` to inject test data into the suite title from the tagged template expressions, and `$#` for the index of the row.
  - To inject nested object values use you can supply a keyPath i.e. `$variable.path.to.value`
- `fn`: `Function` the suite of tests to be run, this is the function that will receive the test data object.
- Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.

Example:

```js
describe.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('$a + $b', ({a, b, expected}) => {
  test(`returns ${expected}`, () => {
    expect(a + b).toBe(expected);
  });

  test(`returned value not be greater than ${expected}`, () => {
    expect(a + b).not.toBeGreaterThan(expected);
  });

  test(`returned value not be less than ${expected}`, () => {
    expect(a + b).not.toBeLessThan(expected);
  });
});
```

### `describe.only(name, fn)`

Also under the alias: `fdescribe(name, fn)`

You can use `describe.only` if you want to run only one describe block:

```js
describe.only('my beverage', () => {
  test('is delicious', () => {
    expect(myBeverage.delicious).toBeTruthy();
  });

  test('is not sour', () => {
    expect(myBeverage.sour).toBeFalsy();
  });
});

describe('my other beverage', () => {
  // ... will be skipped
});
```

### `describe.only.each(table)(name, fn)`

Also under the aliases: `fdescribe.each(table)(name, fn)` and ``fdescribe.each`table`(name, fn)``

Use `describe.only.each` if you want to only run specific tests suites of data driven tests.

`describe.only.each` is available with two APIs:

#### `describe.only.each(table)(name, fn)`

```js
describe.only.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  test(`returns ${expected}`, () => {
    expect(a + b).toBe(expected);
  });
});

test('will not be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

#### ``describe.only.each`table`(name, fn)``

```js
describe.only.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', ({a, b, expected}) => {
  test('passes', () => {
    expect(a + b).toBe(expected);
  });
});

test('will not be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

### `describe.skip(name, fn)`

Also under the alias: `xdescribe(name, fn)`

You can use `describe.skip` if you do not want to run the tests of a particular `describe` block:

```js
describe('my beverage', () => {
  test('is delicious', () => {
    expect(myBeverage.delicious).toBeTruthy();
  });

  test('is not sour', () => {
    expect(myBeverage.sour).toBeFalsy();
  });
});

describe.skip('my other beverage', () => {
  // ... will be skipped
});
```

Using `describe.skip` is often a cleaner alternative to temporarily commenting out a chunk of tests. Beware that the `describe` block will still run. If you have some setup that also should be skipped, do it in a `beforeAll` or `beforeEach` block.

### `describe.skip.each(table)(name, fn)`

Also under the aliases: `xdescribe.each(table)(name, fn)` and ``xdescribe.each`table`(name, fn)``

Use `describe.skip.each` if you want to stop running a suite of data driven tests.

`describe.skip.each` is available with two APIs:

#### `describe.skip.each(table)(name, fn)`

```js
describe.skip.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  test(`returns ${expected}`, () => {
    expect(a + b).toBe(expected); // will not be run
  });
});

test('will be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

#### ``describe.skip.each`table`(name, fn)``

```js
describe.skip.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', ({a, b, expected}) => {
  test('will not be run', () => {
    expect(a + b).toBe(expected); // will not be run
  });
});

test('will be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

### `test(name, fn, timeout)`

Also under the alias: `it(name, fn, timeout)`

All you need in a test file is the `test` method which runs a test. For example, let's say there's a function `inchesOfRain()` that should be zero. Your whole test could be:

```js
test('did not rain', () => {
  expect(inchesOfRain()).toBe(0);
});
```

The first argument is the test name; the second argument is a function that contains the expectations to test. The third argument (optional) is `timeout` (in milliseconds) for specifying how long to wait before aborting. The default timeout is 5 seconds.

If a **promise is returned** from `test`, Jest will wait for the promise to resolve before letting the test complete. For example, let's say `fetchBeverageList()` returns a promise that is supposed to resolve to a list that has `lemon` in it. You can test this with:

```js
test('has lemon in it', () => {
  return fetchBeverageList().then(list => {
    expect(list).toContain('lemon');
  });
});
```

Even though the call to `test` will return right away, the test doesn't complete until the promise resolves. For more details, see [Testing Asynchronous Code](TestingAsyncCode.md) page.

:::tip

Jest will also wait if you **provide an argument to the test function**, usually called `done`. This could be handy when you want to test [callbacks](TestingAsyncCode.md#callbacks).

:::

### `test.concurrent(name, fn, timeout)`

Also under the alias: `it.concurrent(name, fn, timeout)`

:::caution

`test.concurrent` is considered experimental - see [here](https://github.com/jestjs/jest/labels/Area%3A%20Concurrent) for details on missing features and other issues.

:::

Use `test.concurrent` if you want the test to run concurrently.

The first argument is the test name; the second argument is an asynchronous function that contains the expectations to test. The third argument (optional) is `timeout` (in milliseconds) for specifying how long to wait before aborting. The default timeout is 5 seconds.

```js
test.concurrent('addition of 2 numbers', async () => {
  expect(5 + 3).toBe(8);
});

test.concurrent('subtraction 2 numbers', async () => {
  expect(5 - 3).toBe(2);
});
```

:::tip

Use the [`maxConcurrency`](Configuration.md#maxconcurrency-number) configuration option to prevent Jest from executing more than the specified amount of tests at the same time.

:::

### `test.concurrent.each(table)(name, fn, timeout)`

Also under the alias: `it.concurrent.each(table)(name, fn, timeout)`

Use `test.concurrent.each` if you keep duplicating the same test with different data. `test.each` allows you to write the test once and pass data in, the tests are all run asynchronously.

`test.concurrent.each` is available with two APIs:

#### 1. `test.concurrent.each(table)(name, fn, timeout)`

- `table`: `Array` of Arrays with the arguments that are passed into the test `fn` for each row. If you pass in a 1D array of primitives, internally it will be mapped to a table i.e. `[1, 2, 3] -> [[1], [2], [3]]`
- `name`: `String` the title of the test block.
  - Generate unique test titles by positionally injecting parameters with [`printf` formatting](https://nodejs.org/api/util.html#util_util_format_format_args):
    - `%p` - [pretty-format](https://www.npmjs.com/package/pretty-format).
    - `%s`- String.
    - `%d`- Number.
    - `%i` - Integer.
    - `%f` - Floating point value.
    - `%j` - JSON.
    - `%o` - Object.
    - `%#` - Index of the test case.
    - `%$` - Number of the test case.
    - `%%` - single percent sign ('%'). This does not consume an argument.
- `fn`: `Function` the test to be run, this is the function that will receive the parameters in each row as function arguments, **this will have to be an asynchronous function**.
- Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.

Example:

```js
test.concurrent.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', async (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

#### 2. ``test.concurrent.each`table`(name, fn, timeout)``

- `table`: `Tagged Template Literal`
  - First row of variable name column headings separated with `|`
  - One or more subsequent rows of data supplied as template literal expressions using `${value}` syntax.
- `name`: `String` the title of the test, use `$variable` to inject test data into the test title from the tagged template expressions.
  - To inject nested object values use you can supply a keyPath i.e. `$variable.path.to.value`
- `fn`: `Function` the test to be run, this is the function that will receive the test data object, **this will have to be an asynchronous function**.
- Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.

Example:

```js
test.concurrent.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', async ({a, b, expected}) => {
  expect(a + b).toBe(expected);
});
```

### `test.concurrent.only.each(table)(name, fn)`

Also under the alias: `it.concurrent.only.each(table)(name, fn)`

Use `test.concurrent.only.each` if you want to only run specific tests with different test data concurrently.

`test.concurrent.only.each` is available with two APIs:

#### `test.concurrent.only.each(table)(name, fn)`

```js
test.concurrent.only.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', async (a, b, expected) => {
  expect(a + b).toBe(expected);
});

test('will not be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

#### ``test.only.each`table`(name, fn)``

```js
test.concurrent.only.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', async ({a, b, expected}) => {
  expect(a + b).toBe(expected);
});

test('will not be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

### `test.concurrent.skip.each(table)(name, fn)`

Also under the alias: `it.concurrent.skip.each(table)(name, fn)`

Use `test.concurrent.skip.each` if you want to stop running a collection of asynchronous data driven tests.

`test.concurrent.skip.each` is available with two APIs:

#### `test.concurrent.skip.each(table)(name, fn)`

```js
test.concurrent.skip.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', async (a, b, expected) => {
  expect(a + b).toBe(expected); // will not be run
});

test('will be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

#### ``test.concurrent.skip.each`table`(name, fn)``

```js
test.concurrent.skip.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', async ({a, b, expected}) => {
  expect(a + b).toBe(expected); // will not be run
});

test('will be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

### `test.each(table)(name, fn, timeout)`

Also under the alias: `it.each(table)(name, fn)` and ``it.each`table`(name, fn)``

Use `test.each` if you keep duplicating the same test with different data. `test.each` allows you to write the test once and pass data in.

`test.each` is available with two APIs:

#### 1. `test.each(table)(name, fn, timeout)`

- `table`: `Array` of Arrays with the arguments that are passed into the test `fn` for each row. If you pass in a 1D array of primitives, internally it will be mapped to a table i.e. `[1, 2, 3] -> [[1], [2], [3]]`
- `name`: `String` the title of the test block.
  - Generate unique test titles by positionally injecting parameters with [`printf` formatting](https://nodejs.org/api/util.html#util_util_format_format_args):
    - `%p` - [pretty-format](https://www.npmjs.com/package/pretty-format).
    - `%s`- String.
    - `%d`- Number.
    - `%i` - Integer.
    - `%f` - Floating point value.
    - `%j` - JSON.
    - `%o` - Object.
    - `%#` - Index of the test case.
    - `%$` - Number of the test case.
    - `%%` - single percent sign ('%'). This does not consume an argument.
  - Or generate unique test titles by injecting properties of test case object with `$variable`
    - To inject nested object values use you can supply a keyPath i.e. `$variable.path.to.value`
    - You can use `$#` to inject the index of the test case
    - You cannot use `$variable` with the `printf` formatting except for `%%`
- `fn`: `Function` the test to be run, this is the function that will receive the parameters in each row as function arguments.
- Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.

Example:

```js
test.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

```js
test.each([
  {a: 1, b: 1, expected: 2},
  {a: 1, b: 2, expected: 3},
  {a: 2, b: 1, expected: 3},
])('.add($a, $b)', ({a, b, expected}) => {
  expect(a + b).toBe(expected);
});
```

#### 2. ``test.each`table`(name, fn, timeout)``

- `table`: `Tagged Template Literal`
  - First row of variable name column headings separated with `|`
  - One or more subsequent rows of data supplied as template literal expressions using `${value}` syntax.
- `name`: `String` the title of the test, use `$variable` to inject test data into the test title from the tagged template expressions.
  - To inject nested object values use you can supply a keyPath i.e. `$variable.path.to.value`
- `fn`: `Function` the test to be run, this is the function that will receive the test data object.
- Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait for each row before aborting. The default timeout is 5 seconds.

Example:

```js
test.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', ({a, b, expected}) => {
  expect(a + b).toBe(expected);
});
```

### `test.failing(name, fn, timeout)`

Also under the alias: `it.failing(name, fn, timeout)`

:::note

This is only available with the default [jest-circus](https://github.com/jestjs/jest/tree/main/packages/jest-circus) runner.

:::

Use `test.failing` when you are writing a test and expecting it to fail. These tests will behave the other way normal tests do. If `failing` test will throw any errors then it will pass. If it does not throw it will fail.

:::tip

You can use this type of test i.e. when writing code in a BDD way. In that case the tests will not show up as failing until they pass. Then you can just remove the `failing` modifier to make them pass.

It can also be a nice way to contribute failing tests to a project, even if you don't know how to fix the bug.

:::

Example:

```js
test.failing('it is not equal', () => {
  expect(5).toBe(6); // this test will pass
});

test.failing('it is equal', () => {
  expect(10).toBe(10); // this test will fail
});
```

### `test.failing.each(name, fn, timeout)`

Also under the alias: `it.failing.each(table)(name, fn)` and ``it.failing.each`table`(name, fn)``

:::note

This is only available with the default [jest-circus](https://github.com/jestjs/jest/tree/main/packages/jest-circus) runner.

:::

You can also run multiple tests at once by adding `each` after `failing`.

Example:

```js
test.failing.each([
  {a: 1, b: 1, expected: 2},
  {a: 1, b: 2, expected: 3},
  {a: 2, b: 1, expected: 3},
])('.add($a, $b)', ({a, b, expected}) => {
  expect(a + b).toBe(expected);
});
```

### `test.only.failing(name, fn, timeout)`

Also under the aliases: `it.only.failing(name, fn, timeout)`, `fit.failing(name, fn, timeout)`

:::note

This is only available with the default [jest-circus](https://github.com/jestjs/jest/tree/main/packages/jest-circus) runner.

:::

Use `test.only.failing` if you want to only run a specific failing test.

### `test.skip.failing(name, fn, timeout)`

Also under the aliases: `it.skip.failing(name, fn, timeout)`, `xit.failing(name, fn, timeout)`, `xtest.failing(name, fn, timeout)`

:::note

This is only available with the default [jest-circus](https://github.com/jestjs/jest/tree/main/packages/jest-circus) runner.

:::

Use `test.skip.failing` if you want to skip running a specific failing test.

### `test.only(name, fn, timeout)`

Also under the aliases: `it.only(name, fn, timeout)`, and `fit(name, fn, timeout)`

When you are debugging a large test file, you will often only want to run a subset of tests. You can use `.only` to specify which tests are the only ones you want to run in that test file.

Optionally, you can provide a `timeout` (in milliseconds) for specifying how long to wait before aborting. The default timeout is 5 seconds.

For example, let's say you had these tests:

```js
test.only('it is raining', () => {
  expect(inchesOfRain()).toBeGreaterThan(0);
});

test('it is not snowing', () => {
  expect(inchesOfSnow()).toBe(0);
});
```

Only the "it is raining" test will run in that test file, since it is run with `test.only`.

Usually you wouldn't check code using `test.only` into source control - you would use it for debugging, and remove it once you have fixed the broken tests.

### `test.only.each(table)(name, fn)`

Also under the aliases: `it.only.each(table)(name, fn)`, `fit.each(table)(name, fn)`, ``it.only.each`table`(name, fn)`` and ``fit.each`table`(name, fn)``

Use `test.only.each` if you want to only run specific tests with different test data.

`test.only.each` is available with two APIs:

#### `test.only.each(table)(name, fn)`

```js
test.only.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  expect(a + b).toBe(expected);
});

test('will not be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

#### ``test.only.each`table`(name, fn)``

```js
test.only.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', ({a, b, expected}) => {
  expect(a + b).toBe(expected);
});

test('will not be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

### `test.skip(name, fn)`

Also under the aliases: `it.skip(name, fn)`, `xit(name, fn)`, and `xtest(name, fn)`

When you are maintaining a large codebase, you may sometimes find a test that is temporarily broken for some reason. If you want to skip running this test, but you don't want to delete this code, you can use `test.skip` to specify some tests to skip.

For example, let's say you had these tests:

```js
test('it is raining', () => {
  expect(inchesOfRain()).toBeGreaterThan(0);
});

test.skip('it is not snowing', () => {
  expect(inchesOfSnow()).toBe(0);
});
```

Only the "it is raining" test will run, since the other test is run with `test.skip`.

You could comment the test out, but it's often a bit nicer to use `test.skip` because it will maintain indentation and syntax highlighting.

### `test.skip.each(table)(name, fn)`

Also under the aliases: `it.skip.each(table)(name, fn)`, `xit.each(table)(name, fn)`, `xtest.each(table)(name, fn)`, ``it.skip.each`table`(name, fn)``, ``xit.each`table`(name, fn)`` and ``xtest.each`table`(name, fn)``

Use `test.skip.each` if you want to stop running a collection of data driven tests.

`test.skip.each` is available with two APIs:

#### `test.skip.each(table)(name, fn)`

```js
test.skip.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  expect(a + b).toBe(expected); // will not be run
});

test('will be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

#### ``test.skip.each`table`(name, fn)``

```js
test.skip.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added to $b', ({a, b, expected}) => {
  expect(a + b).toBe(expected); // will not be run
});

test('will be run', () => {
  expect(1 / 0).toBe(Infinity);
});
```

### `test.todo(name)`

Also under the alias: `it.todo(name)`

Use `test.todo` when you are planning on writing tests. These tests will be highlighted in the summary output at the end so you know how many tests you still need todo.

```js
const add = (a, b) => a + b;

test.todo('add should be associative');
```

:::tip

`test.todo` will throw an error if you pass it a test callback function. Use [`test.skip`](#testskipname-fn) instead, if you already implemented the test, but do not want it to run.

:::

## TypeScript Usage

<TypeScriptExamplesNote />

### `.each`

The `.each` modifier offers few different ways to define a table of the test cases. Some of the APIs have caveats related with the type inference of the arguments which are passed to `describe` or `test` callback functions. Let's take a look at each of them.

:::note

For simplicity `test.each` is picked for the examples, but the type inference is identical in all cases where `.each` modifier can be used: `describe.each`, `test.concurrent.only.each`, `test.skip.each`, etc.

:::

#### Array of objects

The array of objects API is most verbose, but it makes the type inference a painless task. A `table` can be inlined:

```ts
import {test} from '@jest/globals';

test.each([
  {name: 'a', path: 'path/to/a', count: 1, write: true},
  {name: 'b', path: 'path/to/b', count: 3},
])('inline table', ({name, path, count, write}) => {
  // arguments are typed as expected, e.g. `write: boolean | undefined`
});
```

Or declared separately as a variable:

```ts
import {test} from '@jest/globals';

const table = [
  {a: 1, b: 2, expected: 'three', extra: true},
  {a: 3, b: 4, expected: 'seven', extra: false},
  {a: 5, b: 6, expected: 'eleven'},
];

test.each(table)('table as a variable', ({a, b, expected, extra}) => {
  // again everything is typed as expected, e.g. `extra: boolean | undefined`
});
```

#### Array of arrays

The array of arrays style will work smoothly with inlined tables:

```ts
import {test} from '@jest/globals';

test.each([
  [1, 2, 'three', true],
  [3, 4, 'seven', false],
  [5, 6, 'eleven'],
])('inline table example', (a, b, expected, extra) => {
  // arguments are typed as expected, e.g. `extra: boolean | undefined`
});
```

However, if a table is declared as a separate variable, it must be typed as an array of tuples for correct type inference (this is not needed only if all elements of a row are of the same type):

```ts
import {test} from '@jest/globals';

const table: Array<[number, number, string, boolean?]> = [
  [1, 2, 'three', true],
  [3, 4, 'seven', false],
  [5, 6, 'eleven'],
];

test.each(table)('table as a variable example', (a, b, expected, extra) => {
  // without the annotation types are incorrect, e.g. `a: number | string | boolean`
});
```

#### Template literal

If all input values are of the same type, the template literal API will type the arguments correctly:

```ts
import {test} from '@jest/globals';

test.each`
  a    | b    | expected
  ${1} | ${2} | ${3}
  ${3} | ${4} | ${7}
  ${5} | ${6} | ${11}
`('template literal example same type', ({a, b, expected}) => {
  // all arguments are of type `number` because all inputs (a, b, expected) are of type `number`
});
```

If the inputs have different types, the arguments will be typed as a union of all the input types (i.e. type of the variables inside the template literal):

```ts
import {test} from '@jest/globals';

test.each`
  a    | b    | expected
  ${1} | ${2} | ${'three'}
  ${3} | ${4} | ${'seven'}
  ${5} | ${6} | ${'eleven'}
`('template literal example different types', ({a, b, expected}) => {
  // all arguments are of type `number | string` because some inputs (a, b) are of type `number` and some others (expected) are of type `string`
});
```

Otherwise, if you want each argument to have the right type, you have to explicitly provide the generic type argument:

```ts
import {test} from '@jest/globals';

test.each<{a: number; b: number; expected: string; extra?: boolean}>`
  a    | b    | expected    | extra
  ${1} | ${2} | ${'three'}  | ${true}
  ${3} | ${4} | ${'seven'}  | ${false}
  ${5} | ${6} | ${'eleven'}
`('template literal example', ({a, b, expected, extra}) => {
  // all arguments are typed as expected, e.g. `a: number`, `expected: string`, `extra: boolean | undefined`
});
```

:::caution

Keep in mind the variables inside the template literal are not type checked, so you have to ensure that their types are correct.

```ts
import {test} from '@jest/globals';

test.each<{a: number; expected: string}>`
  a                            | expected
  ${1}                         | ${'one'}
  ${'will not raise TS error'} | ${'two'}
  ${3}                         | ${'three'}
`('template literal with wrongly typed input', ({a, expected}) => {
  // all arguments are typed as stated in the generic: `a: number`, `expected: string`
  // WARNING: `a` is of type `number` but will be a string in the 2nd test case.
});
```

:::
