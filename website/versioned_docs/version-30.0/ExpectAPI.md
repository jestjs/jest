---
id: expect
title: Expect
---

When you're writing tests, you often need to check that values meet certain conditions. `expect` gives you access to a number of "matchers" that let you validate different things.

:::tip

For additional Jest matchers maintained by the Jest Community check out [`jest-extended`](https://github.com/jest-community/jest-extended).

:::

import TypeScriptExamplesNote from './_TypeScriptExamplesNote.md';

<TypeScriptExamplesNote />

## Reference

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(1)} />

---

## Expect

### `expect(value)`

The `expect` function is used every time you want to test a value. You will rarely call `expect` by itself. Instead, you will use `expect` along with a "matcher" function to assert something about a value.

It's easier to understand this with an example. Let's say you have a method `bestLaCroixFlavor()` which is supposed to return the string `'grapefruit'`. Here's how you would test that:

```js
test('the best flavor is grapefruit', () => {
  expect(bestLaCroixFlavor()).toBe('grapefruit');
});
```

In this case, `toBe` is the matcher function. There are a lot of different matcher functions, documented below, to help you test different things.

The argument to `expect` should be the value that your code produces, and any argument to the matcher should be the correct value. If you mix them up, your tests will still work, but the error messages on failing tests will look strange.

## Modifiers

### `.not`

If you know how to test something, `.not` lets you test its opposite. For example, this code tests that the best La Croix flavor is not coconut:

```js
test('the best flavor is not coconut', () => {
  expect(bestLaCroixFlavor()).not.toBe('coconut');
});
```

### `.resolves`

Use `resolves` to unwrap the value of a fulfilled promise so any other matcher can be chained. If the promise is rejected the assertion fails.

For example, this code tests that the promise resolves and that the resulting value is `'lemon'`:

```js
test('resolves to lemon', () => {
  // make sure to add a return statement
  return expect(Promise.resolve('lemon')).resolves.toBe('lemon');
});
```

:::note

Since you are still testing promises, the test is still asynchronous. Hence, you will need to [tell Jest to wait](TestingAsyncCode.md#promises) by returning the unwrapped assertion.

Alternatively, you can use `async/await` in combination with `.resolves`:

```js
test('resolves to lemon', async () => {
  await expect(Promise.resolve('lemon')).resolves.toBe('lemon');
  await expect(Promise.resolve('lemon')).resolves.not.toBe('octopus');
});
```

:::

### `.rejects`

Use `.rejects` to unwrap the reason of a rejected promise so any other matcher can be chained. If the promise is fulfilled the assertion fails.

For example, this code tests that the promise rejects with reason `'octopus'`:

```js
test('rejects to octopus', () => {
  // make sure to add a return statement
  return expect(Promise.reject(new Error('octopus'))).rejects.toThrow(
    'octopus',
  );
});
```

:::note

Since you are still testing promises, the test is still asynchronous. Hence, you will need to [tell Jest to wait](TestingAsyncCode.md#promises) by returning the unwrapped assertion.

Alternatively, you can use `async/await` in combination with `.rejects`.

```js
test('rejects to octopus', async () => {
  await expect(Promise.reject(new Error('octopus'))).rejects.toThrow('octopus');
});
```

:::

## Matchers

### `.toBe(value)`

Use `.toBe` to compare primitive values or to check referential identity of object instances. It calls `Object.is` to compare values, which is even better for testing than `===` strict equality operator.

For example, this code will validate some properties of the `can` object:

```js
const can = {
  name: 'pamplemousse',
  ounces: 12,
};

describe('the can', () => {
  test('has 12 ounces', () => {
    expect(can.ounces).toBe(12);
  });

  test('has a sophisticated name', () => {
    expect(can.name).toBe('pamplemousse');
  });
});
```

Don't use `.toBe` with floating-point numbers. For example, due to rounding, in JavaScript `0.2 + 0.1` is not strictly equal to `0.3`. If you have floating point numbers, try `.toBeCloseTo` instead.

Although the `.toBe` matcher **checks** referential identity, it **reports** a deep comparison of values if the assertion fails. If differences between properties do not help you to understand why a test fails, especially if the report is large, then you might move the comparison into the `expect` function. For example, to assert whether or not elements are the same instance:

- rewrite `expect(received).toBe(expected)` as `expect(Object.is(received, expected)).toBe(true)`
- rewrite `expect(received).not.toBe(expected)` as `expect(Object.is(received, expected)).toBe(false)`

### `.toHaveBeenCalled()`

Use `.toHaveBeenCalled` to ensure that a mock function was called.

For example, let's say you have a `drinkAll(drink, flavour)` function that takes a `drink` function and applies it to all available beverages. You might want to check that `drink` gets called. You can do that with this test suite:

```js
function drinkAll(callback, flavour) {
  if (flavour !== 'octopus') {
    callback(flavour);
  }
}

describe('drinkAll', () => {
  test('drinks something lemon-flavoured', () => {
    const drink = jest.fn();
    drinkAll(drink, 'lemon');
    expect(drink).toHaveBeenCalled();
  });

  test('does not drink something octopus-flavoured', () => {
    const drink = jest.fn();
    drinkAll(drink, 'octopus');
    expect(drink).not.toHaveBeenCalled();
  });
});
```

### `.toHaveBeenCalledTimes(number)`

Use `.toHaveBeenCalledTimes` to ensure that a mock function got called exact number of times.

For example, let's say you have a `drinkEach(drink, Array<flavor>)` function that takes a `drink` function and applies it to array of passed beverages. You might want to check that drink function was called exact number of times. You can do that with this test suite:

```js
test('drinkEach drinks each drink', () => {
  const drink = jest.fn();
  drinkEach(drink, ['lemon', 'octopus']);
  expect(drink).toHaveBeenCalledTimes(2);
});
```

### `.toHaveBeenCalledWith(arg1, arg2, ...)`

Use `.toHaveBeenCalledWith` to ensure that a mock function was called with specific arguments. The arguments are checked with the same algorithm that `.toEqual` uses.

For example, let's say that you can register a beverage with a `register` function, and `applyToAll(f)` should apply the function `f` to all registered beverages. To make sure this works, you could write:

```js
test('registration applies correctly to orange La Croix', () => {
  const beverage = new LaCroix('orange');
  register(beverage);
  const f = jest.fn();
  applyToAll(f);
  expect(f).toHaveBeenCalledWith(beverage);
});
```

### `.toHaveBeenLastCalledWith(arg1, arg2, ...)`

If you have a mock function, you can use `.toHaveBeenLastCalledWith` to test what arguments it was last called with. For example, let's say you have a `applyToAllFlavors(f)` function that applies `f` to a bunch of flavors, and you want to ensure that when you call it, the last flavor it operates on is `'mango'`. You can write:

```js
test('applying to all flavors does mango last', () => {
  const drink = jest.fn();
  applyToAllFlavors(drink);
  expect(drink).toHaveBeenLastCalledWith('mango');
});
```

### `.toHaveBeenNthCalledWith(nthCall, arg1, arg2, ....)`

If you have a mock function, you can use `.toHaveBeenNthCalledWith` to test what arguments it was nth called with. For example, let's say you have a `drinkEach(drink, Array<flavor>)` function that applies `f` to a bunch of flavors, and you want to ensure that when you call it, the first flavor it operates on is `'lemon'` and the second one is `'octopus'`. You can write:

```js
test('drinkEach drinks each drink', () => {
  const drink = jest.fn();
  drinkEach(drink, ['lemon', 'octopus']);
  expect(drink).toHaveBeenNthCalledWith(1, 'lemon');
  expect(drink).toHaveBeenNthCalledWith(2, 'octopus');
});
```

:::note

The nth argument must be positive integer starting from 1.

:::

### `.toHaveReturned()`

If you have a mock function, you can use `.toHaveReturned` to test that the mock function successfully returned (i.e., did not throw an error) at least one time. For example, let's say you have a mock `drink` that returns `true`. You can write:

```js
test('drinks returns', () => {
  const drink = jest.fn(() => true);

  drink();

  expect(drink).toHaveReturned();
});
```

### `.toHaveReturnedTimes(number)`

Use `.toHaveReturnedTimes` to ensure that a mock function returned successfully (i.e., did not throw an error) an exact number of times. Any calls to the mock function that throw an error are not counted toward the number of times the function returned.

For example, let's say you have a mock `drink` that returns `true`. You can write:

```js
test('drink returns twice', () => {
  const drink = jest.fn(() => true);

  drink();
  drink();

  expect(drink).toHaveReturnedTimes(2);
});
```

### `.toHaveReturnedWith(value)`

Use `.toHaveReturnedWith` to ensure that a mock function returned a specific value.

For example, let's say you have a mock `drink` that returns the name of the beverage that was consumed. You can write:

```js
test('drink returns La Croix', () => {
  const beverage = {name: 'La Croix'};
  const drink = jest.fn(beverage => beverage.name);

  drink(beverage);

  expect(drink).toHaveReturnedWith('La Croix');
});
```

### `.toHaveLastReturnedWith(value)`

Use `.toHaveLastReturnedWith` to test the specific value that a mock function last returned. If the last call to the mock function threw an error, then this matcher will fail no matter what value you provided as the expected return value.

For example, let's say you have a mock `drink` that returns the name of the beverage that was consumed. You can write:

```js
test('drink returns La Croix (Orange) last', () => {
  const beverage1 = {name: 'La Croix (Lemon)'};
  const beverage2 = {name: 'La Croix (Orange)'};
  const drink = jest.fn(beverage => beverage.name);

  drink(beverage1);
  drink(beverage2);

  expect(drink).toHaveLastReturnedWith('La Croix (Orange)');
});
```

### `.toHaveNthReturnedWith(nthCall, value)`

Use `.toHaveNthReturnedWith` to test the specific value that a mock function returned for the nth call. If the nth call to the mock function threw an error, then this matcher will fail no matter what value you provided as the expected return value.

For example, let's say you have a mock `drink` that returns the name of the beverage that was consumed. You can write:

```js
test('drink returns expected nth calls', () => {
  const beverage1 = {name: 'La Croix (Lemon)'};
  const beverage2 = {name: 'La Croix (Orange)'};
  const drink = jest.fn(beverage => beverage.name);

  drink(beverage1);
  drink(beverage2);

  expect(drink).toHaveNthReturnedWith(1, 'La Croix (Lemon)');
  expect(drink).toHaveNthReturnedWith(2, 'La Croix (Orange)');
});
```

:::note

The nth argument must be positive integer starting from 1.

:::

### `.toHaveLength(number)`

Use `.toHaveLength` to check that an object has a `.length` property and it is set to a certain numeric value.

This is especially useful for checking arrays or strings size.

```js
expect([1, 2, 3]).toHaveLength(3);
expect('abc').toHaveLength(3);
expect('').not.toHaveLength(5);
```

### `.toHaveProperty(keyPath, value?)`

Use `.toHaveProperty` to check if property at provided reference `keyPath` exists for an object. For checking deeply nested properties in an object you may use [dot notation](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Property_accessors) or an array containing the keyPath for deep references.

You can provide an optional `value` argument to compare the received property value (recursively for all properties of object instances, also known as deep equality, like the `toEqual` matcher).

The following example contains a `houseForSale` object with nested properties. We are using `toHaveProperty` to check for the existence and values of various properties in the object.

```js
// Object containing house features to be tested
const houseForSale = {
  bath: true,
  bedrooms: 4,
  kitchen: {
    amenities: ['oven', 'stove', 'washer'],
    area: 20,
    wallColor: 'white',
    'nice.oven': true,
  },
  livingroom: {
    amenities: [
      {
        couch: [
          ['large', {dimensions: [20, 20]}],
          ['small', {dimensions: [10, 10]}],
        ],
      },
    ],
  },
  'ceiling.height': 2,
};

test('this house has my desired features', () => {
  // Example Referencing
  expect(houseForSale).toHaveProperty('bath');
  expect(houseForSale).toHaveProperty('bedrooms', 4);

  expect(houseForSale).not.toHaveProperty('pool');

  // Deep referencing using dot notation
  expect(houseForSale).toHaveProperty('kitchen.area', 20);
  expect(houseForSale).toHaveProperty('kitchen.amenities', [
    'oven',
    'stove',
    'washer',
  ]);

  expect(houseForSale).not.toHaveProperty('kitchen.open');

  // Deep referencing using an array containing the keyPath
  expect(houseForSale).toHaveProperty(['kitchen', 'area'], 20);
  expect(houseForSale).toHaveProperty(
    ['kitchen', 'amenities'],
    ['oven', 'stove', 'washer'],
  );
  expect(houseForSale).toHaveProperty(['kitchen', 'amenities', 0], 'oven');
  expect(houseForSale).toHaveProperty(
    'livingroom.amenities[0].couch[0][1].dimensions[0]',
    20,
  );
  expect(houseForSale).toHaveProperty(['kitchen', 'nice.oven']);
  expect(houseForSale).not.toHaveProperty(['kitchen', 'open']);

  // Referencing keys with dot in the key itself
  expect(houseForSale).toHaveProperty(['ceiling.height'], 'tall');
});
```

### `.toBeCloseTo(number, numDigits?)`

Use `toBeCloseTo` to compare floating point numbers for approximate equality.

The optional `numDigits` argument limits the number of digits to check **after** the decimal point. For the default value `2`, the test criterion is `Math.abs(expected - received) < 0.005` (that is, `10 ** -2 / 2`).

Intuitive equality comparisons often fail, because arithmetic on decimal (base 10) values often have rounding errors in limited precision binary (base 2) representation. For example, this test fails:

```js
test('adding works sanely with decimals', () => {
  expect(0.2 + 0.1).toBe(0.3); // Fails!
});
```

It fails because in JavaScript, `0.2 + 0.1` is actually `0.30000000000000004`.

For example, this test passes with a precision of 5 digits:

```js
test('adding works sanely with decimals', () => {
  expect(0.2 + 0.1).toBeCloseTo(0.3, 5);
});
```

Because floating point errors are the problem that `toBeCloseTo` solves, it does not support big integer values.

### `.toBeDefined()`

Use `.toBeDefined` to check that a variable is not undefined. For example, if you want to check that a function `fetchNewFlavorIdea()` returns _something_, you can write:

```js
test('there is a new flavor idea', () => {
  expect(fetchNewFlavorIdea()).toBeDefined();
});
```

You could write `expect(fetchNewFlavorIdea()).not.toBe(undefined)`, but it's better practice to avoid referring to `undefined` directly in your code.

### `.toBeFalsy()`

Use `.toBeFalsy` when you don't care what a value is and you want to ensure a value is false in a boolean context. For example, let's say you have some application code that looks like:

```js
drinkSomeLaCroix();
if (!getErrors()) {
  drinkMoreLaCroix();
}
```

You may not care what `getErrors` returns, specifically - it might return `false`, `null`, or `0`, and your code would still work. So if you want to test there are no errors after drinking some La Croix, you could write:

```js
test('drinking La Croix does not lead to errors', () => {
  drinkSomeLaCroix();
  expect(getErrors()).toBeFalsy();
});
```

In JavaScript, there are six falsy values: `false`, `0`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy.

### `.toBeGreaterThan(number | bigint)`

Use `toBeGreaterThan` to compare `received > expected` for number or big integer values. For example, test that `ouncesPerCan()` returns a value of more than 10 ounces:

```js
test('ounces per can is more than 10', () => {
  expect(ouncesPerCan()).toBeGreaterThan(10);
});
```

### `.toBeGreaterThanOrEqual(number | bigint)`

Use `toBeGreaterThanOrEqual` to compare `received >= expected` for number or big integer values. For example, test that `ouncesPerCan()` returns a value of at least 12 ounces:

```js
test('ounces per can is at least 12', () => {
  expect(ouncesPerCan()).toBeGreaterThanOrEqual(12);
});
```

### `.toBeLessThan(number | bigint)`

Use `toBeLessThan` to compare `received < expected` for number or big integer values. For example, test that `ouncesPerCan()` returns a value of less than 20 ounces:

```js
test('ounces per can is less than 20', () => {
  expect(ouncesPerCan()).toBeLessThan(20);
});
```

### `.toBeLessThanOrEqual(number | bigint)`

Use `toBeLessThanOrEqual` to compare `received <= expected` for number or big integer values. For example, test that `ouncesPerCan()` returns a value of at most 12 ounces:

```js
test('ounces per can is at most 12', () => {
  expect(ouncesPerCan()).toBeLessThanOrEqual(12);
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

test('bloop returns null', () => {
  expect(bloop()).toBeNull();
});
```

### `.toBeTruthy()`

Use `.toBeTruthy` when you don't care what a value is and you want to ensure a value is true in a boolean context. For example, let's say you have some application code that looks like:

```js
drinkSomeLaCroix();
if (thirstInfo()) {
  drinkMoreLaCroix();
}
```

You may not care what `thirstInfo` returns, specifically - it might return `true` or a complex object, and your code would still work. So if you want to test that `thirstInfo` will be truthy after drinking some La Croix, you could write:

```js
test('drinking La Croix leads to having thirst info', () => {
  drinkSomeLaCroix();
  expect(thirstInfo()).toBeTruthy();
});
```

In JavaScript, there are six falsy values: `false`, `0`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy.

### `.toBeUndefined()`

Use `.toBeUndefined` to check that a variable is undefined. For example, if you want to check that a function `bestDrinkForFlavor(flavor)` returns `undefined` for the `'octopus'` flavor, because there is no good octopus-flavored drink:

```js
test('the best drink for octopus flavor is undefined', () => {
  expect(bestDrinkForFlavor('octopus')).toBeUndefined();
});
```

You could write `expect(bestDrinkForFlavor('octopus')).toBe(undefined)`, but it's better practice to avoid referring to `undefined` directly in your code.

### `.toBeNaN()`

Use `.toBeNaN` when checking a value is `NaN`.

```js
test('passes when value is NaN', () => {
  expect(NaN).toBeNaN();
  expect(1).not.toBeNaN();
});
```

### `.toContain(item)`

Use `.toContain` when you want to check that an item is in an array. For testing the items in the array, this uses `===`, a strict equality check. `.toContain` can also check whether a string is a substring of another string.

For example, if `getAllFlavors()` returns an array of flavors and you want to be sure that `lime` is in there, you can write:

```js
test('the flavor list contains lime', () => {
  expect(getAllFlavors()).toContain('lime');
});
```

This matcher also accepts others iterables such as strings, sets, node lists and HTML collections.

### `.toContainEqual(item)`

Use `.toContainEqual` when you want to check that an item with a specific structure and values is contained in an array. For testing the items in the array, this matcher recursively checks the equality of all fields, rather than checking for object identity.

```js
describe('my beverage', () => {
  test('is delicious and not sour', () => {
    const myBeverage = {delicious: true, sour: false};
    expect(myBeverages()).toContainEqual(myBeverage);
  });
});
```

### `.toEqual(value)`

Use `.toEqual` to compare recursively all properties of object instances (also known as "deep" equality). It calls `Object.is` to compare primitive values, which is even better for testing than `===` strict equality operator.

For example, `.toEqual` and `.toBe` behave differently in this test suite, so all the tests pass:

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
  test('have all the same properties', () => {
    expect(can1).toEqual(can2);
  });
  test('are not the exact same can', () => {
    expect(can1).not.toBe(can2);
  });
});
```

:::tip

`toEqual` ignores object keys with `undefined` properties, `undefined` array items, array sparseness, or object type mismatch. To take these into account use [`.toStrictEqual`](#tostrictequalvalue) instead.

:::

:::info

`.toEqual` won't perform a _deep equality_ check for two errors. Only the `message` property of an Error is considered for equality. It is recommended to use the `.toThrow` matcher for testing against errors.

:::

If differences between properties do not help you to understand why a test fails, especially if the report is large, then you might move the comparison into the `expect` function. For example, use `equals` method of `Buffer` class to assert whether or not buffers contain the same content:

- rewrite `expect(received).toEqual(expected)` as `expect(received.equals(expected)).toBe(true)`
- rewrite `expect(received).not.toEqual(expected)` as `expect(received.equals(expected)).toBe(false)`

### `.toMatch(regexp | string)`

Use `.toMatch` to check that a string matches a regular expression.

For example, you might not know what exactly `essayOnTheBestFlavor()` returns, but you know it's a really long string, and the substring `grapefruit` should be in there somewhere. You can test this with:

```js
describe('an essay on the best flavor', () => {
  test('mentions grapefruit', () => {
    expect(essayOnTheBestFlavor()).toMatch(/grapefruit/);
    expect(essayOnTheBestFlavor()).toMatch(new RegExp('grapefruit'));
  });
});
```

This matcher also accepts a string, which it will try to match:

```js
describe('grapefruits are healthy', () => {
  test('grapefruits are a fruit', () => {
    expect('grapefruits').toMatch('fruit');
  });
});
```

### `.toMatchObject(object)`

Use `.toMatchObject` to check that a JavaScript object matches a subset of the properties of an object. It will match received objects with properties that are **not** in the expected object.

You can also pass an array of objects, in which case the method will return true only if each object in the received array matches (in the `toMatchObject` sense described above) the corresponding object in the expected array. This is useful if you want to check that two arrays match in their number of elements, as opposed to `arrayContaining`, which allows for extra elements in the received array.

You can match properties against values or against matchers.

```js
const houseForSale = {
  bath: true,
  bedrooms: 4,
  kitchen: {
    amenities: ['oven', 'stove', 'washer'],
    area: 20,
    wallColor: 'white',
  },
};
const desiredHouse = {
  bath: true,
  kitchen: {
    amenities: ['oven', 'stove', 'washer'],
    wallColor: expect.stringMatching(/white|yellow/),
  },
};

test('the house has my desired features', () => {
  expect(houseForSale).toMatchObject(desiredHouse);
});
```

```js
describe('toMatchObject applied to arrays', () => {
  test('the number of elements must match exactly', () => {
    expect([{foo: 'bar'}, {baz: 1}]).toMatchObject([{foo: 'bar'}, {baz: 1}]);
  });

  test('.toMatchObject is called for each elements, so extra object properties are okay', () => {
    expect([{foo: 'bar'}, {baz: 1, extra: 'quux'}]).toMatchObject([
      {foo: 'bar'},
      {baz: 1},
    ]);
  });
});
```

### `.toMatchSnapshot(propertyMatchers?, hint?)`

This ensures that a value matches the most recent snapshot. Check out [the Snapshot Testing guide](SnapshotTesting.md) for more information.

You can provide an optional `propertyMatchers` object argument, which has asymmetric matchers as values of a subset of expected properties, **if** the received value will be an **object** instance. It is like `toMatchObject` with flexible criteria for a subset of properties, followed by a snapshot test as exact criteria for the rest of the properties.

You can provide an optional `hint` string argument that is appended to the test name. Although Jest always appends a number at the end of a snapshot name, short descriptive hints might be more useful than numbers to differentiate **multiple** snapshots in a **single** `it` or `test` block. Jest sorts snapshots by name in the corresponding `.snap` file.

### `.toMatchInlineSnapshot(propertyMatchers?, inlineSnapshot)`

Ensures that a value matches the most recent snapshot.

You can provide an optional `propertyMatchers` object argument, which has asymmetric matchers as values of a subset of expected properties, **if** the received value will be an **object** instance. It is like `toMatchObject` with flexible criteria for a subset of properties, followed by a snapshot test as exact criteria for the rest of the properties.

Jest adds the `inlineSnapshot` string argument to the matcher in the test file (instead of an external `.snap` file) the first time that the test runs.

Check out the section on [Inline Snapshots](SnapshotTesting.md#inline-snapshots) for more info.

### `.toStrictEqual(value)`

Use `.toStrictEqual` to test that objects have the same structure and type.

Differences from `.toEqual`:

- keys with `undefined` properties are checked, e.g. `{a: undefined, b: 2}` will not equal `{b: 2}`;
- `undefined` items are taken into account, e.g. `[2]` will not equal `[2, undefined]`;
- array sparseness is checked, e.g. `[, 1]` will not equal `[undefined, 1]`;
- object types are checked, e.g. a class instance with fields `a` and `b` will not equal a literal object with fields `a` and `b`.

```js
class LaCroix {
  constructor(flavor) {
    this.flavor = flavor;
  }
}

describe('the La Croix cans on my desk', () => {
  test('are not semantically the same', () => {
    expect(new LaCroix('lemon')).toEqual({flavor: 'lemon'});
    expect(new LaCroix('lemon')).not.toStrictEqual({flavor: 'lemon'});
  });
});
```

### `.toThrow(error?)`

Use `.toThrow` to test that a function throws when it is called. For example, if we want to test that `drinkFlavor('octopus')` throws, because octopus flavor is too disgusting to drink, we could write:

```js
test('throws on octopus', () => {
  expect(() => {
    drinkFlavor('octopus');
  }).toThrow();
});
```

:::tip

You must wrap the code in a function, otherwise the error will not be caught and the assertion will fail.

:::

You can provide an optional argument to test that a specific error is thrown:

- regular expression: error message **matches** the pattern
- string: error message **includes** the substring
- error object: error message is **equal to** the message property of the object
- error class: error object is **instance of** class

For example, let's say that `drinkFlavor` is coded like this:

```js
function drinkFlavor(flavor) {
  if (flavor === 'octopus') {
    throw new DisgustingFlavorError('yuck, octopus flavor');
  }
  // Do some other stuff
}
```

We could test this error gets thrown in several ways:

```js
test('throws on octopus', () => {
  function drinkOctopus() {
    drinkFlavor('octopus');
  }

  // Test that the error message says "yuck" somewhere: these are equivalent
  expect(drinkOctopus).toThrow(/yuck/);
  expect(drinkOctopus).toThrow('yuck');

  // Test the exact error message
  expect(drinkOctopus).toThrow(/^yuck, octopus flavor$/);
  expect(drinkOctopus).toThrow(new Error('yuck, octopus flavor'));

  // Test that we get a DisgustingFlavorError
  expect(drinkOctopus).toThrow(DisgustingFlavorError);
});
```

### `.toThrowErrorMatchingSnapshot(hint?)`

Use `.toThrowErrorMatchingSnapshot` to test that a function throws an error matching the most recent snapshot when it is called.

You can provide an optional `hint` string argument that is appended to the test name. Although Jest always appends a number at the end of a snapshot name, short descriptive hints might be more useful than numbers to differentiate **multiple** snapshots in a **single** `it` or `test` block. Jest sorts snapshots by name in the corresponding `.snap` file.

For example, let's say you have a `drinkFlavor` function that throws whenever the flavor is `'octopus'`, and is coded like this:

```js
function drinkFlavor(flavor) {
  if (flavor === 'octopus') {
    throw new DisgustingFlavorError('yuck, octopus flavor');
  }
  // Do some other stuff
}
```

The test for this function will look this way:

```js
test('throws on octopus', () => {
  function drinkOctopus() {
    drinkFlavor('octopus');
  }

  expect(drinkOctopus).toThrowErrorMatchingSnapshot();
});
```

And it will generate the following snapshot:

```js
exports[`drinking flavors throws on octopus 1`] = `"yuck, octopus flavor"`;
```

Check out [React Tree Snapshot Testing](/blog/2016/07/27/jest-14) for more information on snapshot testing.

### `.toThrowErrorMatchingInlineSnapshot(inlineSnapshot)`

Use `.toThrowErrorMatchingInlineSnapshot` to test that a function throws an error matching the most recent snapshot when it is called.

Jest adds the `inlineSnapshot` string argument to the matcher in the test file (instead of an external `.snap` file) the first time that the test runs.

Check out the section on [Inline Snapshots](SnapshotTesting.md#inline-snapshots) for more info.

## Asymmetric Matchers

### `expect.anything()`

`expect.anything()` matches anything but `null` or `undefined`. You can use it inside `toEqual` or `toHaveBeenCalledWith` instead of a literal value. For example, if you want to check that a mock function is called with a non-null argument:

```js
test('map calls its argument with a non-null argument', () => {
  const mock = jest.fn();
  [1].map(x => mock(x));
  expect(mock).toHaveBeenCalledWith(expect.anything());
});
```

### `expect.any(constructor)`

`expect.any(constructor)` matches anything that was created with the given constructor or if it's a primitive that is of the passed type. You can use it inside `toEqual` or `toHaveBeenCalledWith` instead of a literal value. For example, if you want to check that a mock function is called with a number:

```js
class Cat {}
function getCat(fn) {
  return fn(new Cat());
}

test('randocall calls its callback with a class instance', () => {
  const mock = jest.fn();
  getCat(mock);
  expect(mock).toHaveBeenCalledWith(expect.any(Cat));
});

function randocall(fn) {
  return fn(Math.floor(Math.random() * 6 + 1));
}

test('randocall calls its callback with a number', () => {
  const mock = jest.fn();
  randocall(mock);
  expect(mock).toHaveBeenCalledWith(expect.any(Number));
});
```

### `expect.arrayContaining(array)`

`expect.arrayContaining(array)` matches a received array which contains all of the elements in the expected array. That is, the expected array is a **subset** of the received array. Therefore, it matches a received array which contains elements that are **not** in the expected array.

You can use it instead of a literal value:

- in `toEqual` or `toHaveBeenCalledWith`
- to match a property in `objectContaining` or `toMatchObject`

```js
describe('arrayContaining', () => {
  const expected = ['Alice', 'Bob'];
  it('matches even if received contains additional elements', () => {
    expect(['Alice', 'Bob', 'Eve']).toEqual(expect.arrayContaining(expected));
  });
  it('does not match if received does not contain expected elements', () => {
    expect(['Bob', 'Eve']).not.toEqual(expect.arrayContaining(expected));
  });
});
```

```js
describe('Beware of a misunderstanding! A sequence of dice rolls', () => {
  const expected = [1, 2, 3, 4, 5, 6];
  it('matches even with an unexpected number 7', () => {
    expect([4, 1, 6, 7, 3, 5, 2, 5, 4, 6]).toEqual(
      expect.arrayContaining(expected),
    );
  });
  it('does not match without an expected number 2', () => {
    expect([4, 1, 6, 7, 3, 5, 7, 5, 4, 6]).not.toEqual(
      expect.arrayContaining(expected),
    );
  });
});
```

### `expect.not.arrayContaining(array)`

`expect.not.arrayContaining(array)` matches a received array which does not contain all of the elements in the expected array. That is, the expected array **is not a subset** of the received array.

It is the inverse of `expect.arrayContaining`.

```js
describe('not.arrayContaining', () => {
  const expected = ['Samantha'];

  it('matches if the actual array does not contain the expected elements', () => {
    expect(['Alice', 'Bob', 'Eve']).toEqual(
      expect.not.arrayContaining(expected),
    );
  });
});
```

### `expect.arrayOf(value)`

`expect.arrayOf(value)` matches a received array whose elements match the provided value. This is useful for asserting that every item in an array satisfies a particular condition or type.

**Example:**

```js
test('all elements in array are strings', () => {
  expect(['apple', 'banana', 'cherry']).toEqual(
    expect.arrayOf(expect.any(String)),
  );
});
```

This matcher is particularly useful for validating arrays containing complex structures:

```js
test('array of objects with specific properties', () => {
  expect([
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'},
  ]).toEqual(
    expect.arrayOf(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
      }),
    ),
  );
});
```

### `expect.not.arrayOf(value)`

`expect.not.arrayOf(value)` matches a received array where not all elements match the provided matcher.

**Example:**

```js
test('not all elements in array are strings', () => {
  expect(['apple', 123, 'cherry']).toEqual(
    expect.not.arrayOf(expect.any(String)),
  );
});
```

### `expect.closeTo(number, numDigits?)`

`expect.closeTo(number, numDigits?)` is useful when comparing floating point numbers in object properties or array item. If you need to compare a number, please use `.toBeCloseTo` instead.

The optional `numDigits` argument limits the number of digits to check **after** the decimal point. For the default value `2`, the test criterion is `Math.abs(expected - received) < 0.005 (that is, 10 ** -2 / 2)`.

For example, this test passes with a precision of 5 digits:

```js
test('compare float in object properties', () => {
  expect({
    title: '0.1 + 0.2',
    sum: 0.1 + 0.2,
  }).toEqual({
    title: '0.1 + 0.2',
    sum: expect.closeTo(0.3, 5),
  });
});
```

### `expect.objectContaining(object)`

`expect.objectContaining(object)` matches any received object that recursively matches the expected properties. That is, the expected object is a **subset** of the received object. Therefore, it matches a received object which contains properties that **are present** in the expected object.

Instead of literal property values in the expected object, you can use matchers, `expect.anything()`, and so on.

For example, let's say that we expect an `onPress` function to be called with an `Event` object, and all we need to verify is that the event has `event.x` and `event.y` properties. We can do that with:

```js
test('onPress gets called with the right thing', () => {
  const onPress = jest.fn();
  simulatePresses(onPress);
  expect(onPress).toHaveBeenCalledWith(
    expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
    }),
  );
});
```

### `expect.not.objectContaining(object)`

`expect.not.objectContaining(object)` matches any received object that does not recursively match the expected properties. That is, the expected object **is not a subset** of the received object. Therefore, it matches a received object which contains properties that are **not** in the expected object.

It is the inverse of `expect.objectContaining`.

```js
describe('not.objectContaining', () => {
  const expected = {foo: 'bar'};

  it('matches if the actual object does not contain expected key: value pairs', () => {
    expect({bar: 'baz'}).toEqual(expect.not.objectContaining(expected));
  });
});
```

### `expect.stringContaining(string)`

`expect.stringContaining(string)` matches the received value if it is a string that contains the exact expected string.

### `expect.not.stringContaining(string)`

`expect.not.stringContaining(string)` matches the received value if it is not a string or if it is a string that does not contain the exact expected string.

It is the inverse of `expect.stringContaining`.

```js
describe('not.stringContaining', () => {
  const expected = 'Hello world!';

  it('matches if the received value does not contain the expected substring', () => {
    expect('How are you?').toEqual(expect.not.stringContaining(expected));
  });
});
```

### `expect.stringMatching(string | regexp)`

`expect.stringMatching(string | regexp)` matches the received value if it is a string that matches the expected string or regular expression.

You can use it instead of a literal value:

- in `toEqual` or `toHaveBeenCalledWith`
- to match an element in `arrayContaining`
- to match a property in `objectContaining` or `toMatchObject`

This example also shows how you can nest multiple asymmetric matchers, with `expect.stringMatching` inside the `expect.arrayContaining`.

```js
describe('stringMatching in arrayContaining', () => {
  const expected = [
    expect.stringMatching(/^Alic/),
    expect.stringMatching(/^[BR]ob/),
  ];
  it('matches even if received contains additional elements', () => {
    expect(['Alicia', 'Roberto', 'Evelina']).toEqual(
      expect.arrayContaining(expected),
    );
  });
  it('does not match if received does not contain expected elements', () => {
    expect(['Roberto', 'Evelina']).not.toEqual(
      expect.arrayContaining(expected),
    );
  });
});
```

### `expect.not.stringMatching(string | regexp)`

`expect.not.stringMatching(string | regexp)` matches the received value if it is not a string or if it is a string that does not match the expected string or regular expression.

It is the inverse of `expect.stringMatching`.

```js
describe('not.stringMatching', () => {
  const expected = /Hello world!/;

  it('matches if the received value does not match the expected regex', () => {
    expect('How are you?').toEqual(expect.not.stringMatching(expected));
  });
});
```

## Assertion Count

### `expect.assertions(number)`

`expect.assertions(number)` verifies that a certain number of assertions are called during a test. This is often useful when testing asynchronous code, in order to make sure that assertions in a callback actually got called.

For example, let's say that we have a function `doAsync` that receives two callbacks `callback1` and `callback2`, it will asynchronously call both of them in an unknown order. We can test this with:

```js
test('doAsync calls both callbacks', () => {
  expect.assertions(2);
  function callback1(data) {
    expect(data).toBeTruthy();
  }
  function callback2(data) {
    expect(data).toBeTruthy();
  }

  doAsync(callback1, callback2);
});
```

The `expect.assertions(2)` call ensures that both callbacks actually get called.

### `expect.hasAssertions()`

`expect.hasAssertions()` verifies that at least one assertion is called during a test. This is often useful when testing asynchronous code, in order to make sure that assertions in a callback actually got called.

For example, let's say that we have a few functions that all deal with state. `prepareState` calls a callback with a state object, `validateState` runs on that state object, and `waitOnState` returns a promise that waits until all `prepareState` callbacks complete. We can test this with:

```js
test('prepareState prepares a valid state', () => {
  expect.hasAssertions();
  prepareState(state => {
    expect(validateState(state)).toBeTruthy();
  });
  return waitOnState();
});
```

The `expect.hasAssertions()` call ensures that the `prepareState` callback actually gets called.

## Extend Utilities

### `expect.addEqualityTesters(testers)`

You can use `expect.addEqualityTesters` to add your own methods to test if two objects are equal. For example, let's say you have a class in your code that represents volume and can determine if two volumes using different units are equal. You may want `toEqual` (and other equality matchers) to use this custom equality method when comparing to Volume classes. You can add a custom equality tester to have `toEqual` detect and apply custom logic when comparing Volume classes:

```js tab={"span":3} title="Volume.js"
// For simplicity in this example, we'll just support the units 'L' and 'mL'
export class Volume {
  constructor(amount, unit) {
    this.amount = amount;
    this.unit = unit;
  }

  toString() {
    return `[Volume ${this.amount}${this.unit}]`;
  }

  equals(other) {
    if (this.unit === other.unit) {
      return this.amount === other.amount;
    } else if (this.unit === 'L' && other.unit === 'mL') {
      return this.amount * 1000 === other.unit;
    } else {
      return this.amount === other.unit * 1000;
    }
  }
}
```

```js title="areVolumesEqual.js"
import {expect} from '@jest/globals';
import {Volume} from './Volume.js';

function areVolumesEqual(a, b) {
  const isAVolume = a instanceof Volume;
  const isBVolume = b instanceof Volume;

  if (isAVolume && isBVolume) {
    return a.equals(b);
  } else if (isAVolume === isBVolume) {
    return undefined;
  } else {
    return false;
  }
}

expect.addEqualityTesters([areVolumesEqual]);
```

```js title="__tests__/Volume.test.js"
import {expect, test} from '@jest/globals';
import {Volume} from '../Volume.js';
import '../areVolumesEqual.js';

test('are equal with different units', () => {
  expect(new Volume(1, 'L')).toEqual(new Volume(1000, 'mL'));
});
```

```ts tab={"span":3} title="Volume.ts"
// For simplicity in this example, we'll just support the units 'L' and 'mL'
export class Volume {
  public amount: number;
  public unit: 'L' | 'mL';

  constructor(amount: number, unit: 'L' | 'mL') {
    this.amount = amount;
    this.unit = unit;
  }

  toString(): string {
    return `[Volume ${this.amount}${this.unit}]`;
  }

  equals(other: Volume): boolean {
    if (this.unit === other.unit) {
      return this.amount === other.amount;
    } else if (this.unit === 'L' && other.unit === 'mL') {
      return this.amount * 1000 === other.amount;
    } else {
      return this.amount === other.amount * 1000;
    }
  }
}
```

```ts title="areVolumesEqual.ts"
import {expect} from '@jest/globals';
import {Volume} from './Volume.js';

function areVolumesEqual(a: unknown, b: unknown): boolean | undefined {
  const isAVolume = a instanceof Volume;
  const isBVolume = b instanceof Volume;

  if (isAVolume && isBVolume) {
    return a.equals(b);
  } else if (isAVolume === isBVolume) {
    return undefined;
  } else {
    return false;
  }
}

expect.addEqualityTesters([areVolumesEqual]);
```

```ts title="__tests__/Volume.test.ts"
import {expect, test} from '@jest/globals';
import {Volume} from '../Volume.js';
import '../areVolumesEqual.js';

test('are equal with different units', () => {
  expect(new Volume(1, 'L')).toEqual(new Volume(1000, 'mL'));
});
```

#### Custom equality testers API

Custom testers are functions that return either the result (`true` or `false`) of comparing the equality of the two given arguments or `undefined` if the tester does not handle the given objects and wants to delegate equality to other testers (for example, the builtin equality testers).

Custom testers are called with 3 arguments: the two objects to compare and the array of custom testers (used for recursive testers, see the section below).

These helper functions and properties can be found on `this` inside a custom tester:

#### `this.equals(a, b, customTesters?)`

This is a deep-equality function that will return `true` if two objects have the same values (recursively). It optionally takes a list of custom equality testers to apply to the deep equality checks. If you use this function, pass through the custom testers your tester is given so further equality checks `equals` applies can also use custom testers the test author may have configured. See the example in the [Recursive custom equality testers](#recursive-custom-equality-testers) section for more details.

#### Matchers vs Testers

Matchers are methods available on `expect`, for example `expect().toEqual()`. `toEqual` is a matcher. A tester is a method used by matchers that do equality checks to determine if objects are the same.

Custom matchers are good to use when you want to provide a custom assertion that test authors can use in their tests. For example, the `toBeWithinRange` example in the [`expect.extend`](#expectextendmatchers) section is a good example of a custom matcher. Sometimes a test author may want to assert two numbers are exactly equal and should use `toBe`. Other times, however, a test author may want to allow for some flexibility in their test, and `toBeWithinRange` may be a more appropriate assertion.

Custom equality testers are good for globally extending Jest matchers to apply custom equality logic for all equality comparisons. Test authors can't turn on custom testers for certain assertions and turn them off for others (a custom matcher should be used instead if that behavior is desired). For example, defining how to check if two `Volume` objects are equal for all matchers would be a good custom equality tester.

#### Recursive custom equality testers

If your custom equality testers are testing objects with properties you'd like to do deep equality with, you should use the `this.equals` helper available to equality testers. This `equals` method is the same deep equals method Jest uses internally for all of its deep equality comparisons. It's the method that invokes your custom equality tester. It accepts an array of custom equality testers as a third argument. Custom equality testers are also given an array of custom testers as their third argument. Pass this argument into the third argument of `equals` so that any further equality checks deeper into your object can also take advantage of custom equality testers.

For example, let's say you have a `Book` class that contains an array of `Author` classes and both of these classes have custom testers. The `Book` custom tester would want to do a deep equality check on the array of `Author`s and pass in the custom testers given to it, so the `Author`s custom equality tester is applied:

```js title="customEqualityTesters.js"
function areAuthorEqual(a, b) {
  const isAAuthor = a instanceof Author;
  const isBAuthor = b instanceof Author;

  if (isAAuthor && isBAuthor) {
    // Authors are equal if they have the same name
    return a.name === b.name;
  } else if (isAAuthor === isBAuthor) {
    return undefined;
  } else {
    return false;
  }
}

function areBooksEqual(a, b, customTesters) {
  const isABook = a instanceof Book;
  const isBBook = b instanceof Book;

  if (isABook && isBBook) {
    // Books are the same if they have the same name and author array. We need
    // to pass customTesters to equals here so the Author custom tester will be
    // used when comparing Authors
    return (
      a.name === b.name && this.equals(a.authors, b.authors, customTesters)
    );
  } else if (isABook === isBBook) {
    return undefined;
  } else {
    return false;
  }
}

expect.addEqualityTesters([areAuthorsEqual, areBooksEqual]);
```

:::note

Remember to define your equality testers as regular functions and **not** arrow functions in order to access the tester context helpers (e.g. `this.equals`).

:::

### `expect.addSnapshotSerializer(serializer)`

You can call `expect.addSnapshotSerializer` to add a module that formats application-specific data structures.

For an individual test file, an added module precedes any modules from `snapshotSerializers` configuration, which precede the default snapshot serializers for built-in JavaScript types and for React elements. The last module added is the first module tested.

```js
import serializer from 'my-serializer-module';
expect.addSnapshotSerializer(serializer);

// affects expect(value).toMatchSnapshot() assertions in the test file
```

If you add a snapshot serializer in individual test files instead of adding it to `snapshotSerializers` configuration:

- You make the dependency explicit instead of implicit.
- You avoid limits to configuration that might cause you to eject from [create-react-app](https://github.com/facebookincubator/create-react-app).

See [configuring Jest](Configuration.md#snapshotserializers-arraystring) for more information.

### `expect.extend(matchers)`

You can use `expect.extend` to add your own matchers to Jest. For example, let's say that you're testing a number utility library and you're frequently asserting that numbers appear within particular ranges of other numbers. You could abstract that into a `toBeWithinRange` matcher:

```js tab={"span":3} title="toBeWithinRange.js"
import {expect} from '@jest/globals';

function toBeWithinRange(actual, floor, ceiling) {
  if (
    typeof actual !== 'number' ||
    typeof floor !== 'number' ||
    typeof ceiling !== 'number'
  ) {
    throw new TypeError('These must be of type number!');
  }

  const pass = actual >= floor && actual <= ceiling;
  if (pass) {
    return {
      message: () =>
        `expected ${this.utils.printReceived(
          actual,
        )} not to be within range ${this.utils.printExpected(
          `${floor} - ${ceiling}`,
        )}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected ${this.utils.printReceived(
          actual,
        )} to be within range ${this.utils.printExpected(
          `${floor} - ${ceiling}`,
        )}`,
      pass: false,
    };
  }
}

expect.extend({
  toBeWithinRange,
});
```

```js title="__tests__/ranges.test.js"
import {expect, test} from '@jest/globals';
import '../toBeWithinRange';

test('is within range', () => expect(100).toBeWithinRange(90, 110));

test('is NOT within range', () => expect(101).not.toBeWithinRange(0, 100));

test('asymmetric ranges', () => {
  expect({apples: 6, bananas: 3}).toEqual({
    apples: expect.toBeWithinRange(1, 10),
    bananas: expect.not.toBeWithinRange(11, 20),
  });
});
```

```ts title="toBeWithinRange.d.ts"
// optionally add a type declaration, e.g. it enables autocompletion in IDEs
declare module 'expect' {
  interface AsymmetricMatchers {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): R;
  }
}

export {};
```

```ts tab={"span":2} title="toBeWithinRange.ts"
import {expect} from '@jest/globals';
import type {MatcherFunction} from 'expect';

const toBeWithinRange: MatcherFunction<[floor: unknown, ceiling: unknown]> =
  // `floor` and `ceiling` get types from the line above
  // it is recommended to type them as `unknown` and to validate the values
  function (actual, floor, ceiling) {
    if (
      typeof actual !== 'number' ||
      typeof floor !== 'number' ||
      typeof ceiling !== 'number'
    ) {
      throw new TypeError('These must be of type number!');
    }

    const pass = actual >= floor && actual <= ceiling;
    if (pass) {
      return {
        message: () =>
          // `this` context will have correct typings
          `expected ${this.utils.printReceived(
            actual,
          )} not to be within range ${this.utils.printExpected(
            `${floor} - ${ceiling}`,
          )}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${this.utils.printReceived(
            actual,
          )} to be within range ${this.utils.printExpected(
            `${floor} - ${ceiling}`,
          )}`,
        pass: false,
      };
    }
  };

expect.extend({
  toBeWithinRange,
});

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): R;
  }
}
```

```ts tab title="__tests__/ranges.test.ts"
import {expect, test} from '@jest/globals';
import '../toBeWithinRange';

test('is within range', () => expect(100).toBeWithinRange(90, 110));

test('is NOT within range', () => expect(101).not.toBeWithinRange(0, 100));

test('asymmetric ranges', () => {
  expect({apples: 6, bananas: 3}).toEqual({
    apples: expect.toBeWithinRange(1, 10),
    bananas: expect.not.toBeWithinRange(11, 20),
  });
});
```

:::tip

The type declaration of the matcher can live in a `.d.ts` file or in an imported `.ts` module (see JS and TS examples above respectively). If you keep the declaration in a `.d.ts` file, make sure that it is included in the program and that it is a valid module, i.e. it has at least an empty `export {}`.

:::

:::tip

Instead of importing `toBeWithinRange` module to the test file, you can enable the matcher for all tests by moving the `expect.extend` call to a [`setupFilesAfterEnv`](Configuration.md#setupfilesafterenv-array) script:

```js
import {expect} from '@jest/globals';
// remember to export `toBeWithinRange` as well
import {toBeWithinRange} from './toBeWithinRange';

expect.extend({
  toBeWithinRange,
});
```

:::

#### Async Matchers

`expect.extend` also supports async matchers. Async matchers return a Promise so you will need to await the returned value. Let's use an example matcher to illustrate the usage of them. We are going to implement a matcher called `toBeDivisibleByExternalValue`, where the divisible number is going to be pulled from an external source.

```js
expect.extend({
  async toBeDivisibleByExternalValue(received) {
    const externalValue = await getExternalValueFromRemoteSource();
    const pass = received % externalValue === 0;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be divisible by ${externalValue}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be divisible by ${externalValue}`,
        pass: false,
      };
    }
  },
});

test('is divisible by external value', async () => {
  await expect(100).toBeDivisibleByExternalValue();
  await expect(101).not.toBeDivisibleByExternalValue();
});
```

#### Custom Matchers API

Matchers should return an object (or a Promise of an object) with two keys. `pass` indicates whether there was a match or not, and `message` provides a function with no arguments that returns an error message in case of failure. Thus, when `pass` is false, `message` should return the error message for when `expect(x).yourMatcher()` fails. And when `pass` is true, `message` should return the error message for when `expect(x).not.yourMatcher()` fails.

Matchers are called with the argument passed to `expect(x)` followed by the arguments passed to `.yourMatcher(y, z)`:

```js
expect.extend({
  yourMatcher(x, y, z) {
    return {
      pass: true,
      message: () => '',
    };
  },
});
```

These helper functions and properties can be found on `this` inside a custom matcher:

#### `this.isNot`

A boolean to let you know this matcher was called with the negated `.not` modifier allowing you to display a clear and correct matcher hint (see example code).

#### `this.promise`

A string allowing you to display a clear and correct matcher hint:

- `'rejects'` if matcher was called with the promise `.rejects` modifier
- `'resolves'` if matcher was called with the promise `.resolves` modifier
- `''` if matcher was not called with a promise modifier

#### `this.equals(a, b, customTesters?)`

This is a deep-equality function that will return `true` if two objects have the same values (recursively). It optionally takes a list of custom equality testers to apply to the deep equality checks (see `this.customTesters` below).

#### `this.expand`

A boolean to let you know this matcher was called with an `expand` option. When Jest is called with the `--expand` flag, `this.expand` can be used to determine if Jest is expected to show full diffs and errors.

#### `this.utils`

There are a number of helpful tools exposed on `this.utils` primarily consisting of the exports from [`jest-matcher-utils`](https://github.com/jestjs/jest/tree/main/packages/jest-matcher-utils).

The most useful ones are `matcherHint`, `printExpected` and `printReceived` to format the error messages nicely. For example, take a look at the implementation for the `toBe` matcher:

```js
const {diff} = require('jest-diff');
expect.extend({
  toBe(received, expected) {
    const options = {
      comment: 'Object.is equality',
      isNot: this.isNot,
      promise: this.promise,
    };

    const pass = Object.is(received, expected);

    const message = pass
      ? () =>
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint('toBe', undefined, undefined, options) +
          '\n\n' +
          `Expected: not ${this.utils.printExpected(expected)}\n` +
          `Received: ${this.utils.printReceived(received)}`
      : () => {
          const diffString = diff(expected, received, {
            expand: this.expand,
          });
          return (
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint('toBe', undefined, undefined, options) +
            '\n\n' +
            (diffString && diffString.includes('- Expect')
              ? `Difference:\n\n${diffString}`
              : `Expected: ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}`)
          );
        };

    return {actual: received, message, pass};
  },
});
```

This will print something like this:

```bash
  expect(received).toBe(expected)

    Expected value to be (using Object.is):
      "banana"
    Received:
      "apple"
```

When an assertion fails, the error message should give as much signal as necessary to the user so they can resolve their issue quickly. You should craft a precise failure message to make sure users of your custom assertions have a good developer experience.

#### `this.customTesters`

If your matcher does a deep equality check using `this.equals`, you may want to pass user-provided custom testers to `this.equals`. The custom equality testers the user has provided using the `addEqualityTesters` API are available on this property. The built-in Jest matchers pass `this.customTesters` (along with other built-in testers) to `this.equals` to do deep equality, and your custom matchers may want to do the same.

#### Custom snapshot matchers

To use snapshot testing inside of your custom matcher you can import `jest-snapshot` and use it from within your matcher.

Here's a snapshot matcher that trims a string to store for a given length, `.toMatchTrimmedSnapshot(length)`:

```js
const {toMatchSnapshot} = require('jest-snapshot');

expect.extend({
  toMatchTrimmedSnapshot(received, length) {
    return toMatchSnapshot.call(
      this,
      received.slice(0, length),
      'toMatchTrimmedSnapshot',
    );
  },
});

it('stores only 10 characters', () => {
  expect('extra long string oh my gerd').toMatchTrimmedSnapshot(10);
});

/*
Stored snapshot will look like:

exports[`stores only 10 characters: toMatchTrimmedSnapshot 1`] = `"extra long"`;
*/
```

It's also possible to create custom matchers for inline snapshots, the snapshots will be correctly added to the custom matchers. However, inline snapshot will always try to append to the first argument or the second when the first argument is the property matcher, so it's not possible to accept custom arguments in the custom matchers.

```js
const {toMatchInlineSnapshot} = require('jest-snapshot');

expect.extend({
  toMatchTrimmedInlineSnapshot(received, ...rest) {
    return toMatchInlineSnapshot.call(this, received.slice(0, 10), ...rest);
  },
});

it('stores only 10 characters', () => {
  expect('extra long string oh my gerd').toMatchTrimmedInlineSnapshot();
  /*
  The snapshot will be added inline like
  expect('extra long string oh my gerd').toMatchTrimmedInlineSnapshot(
    `"extra long"`
  );
  */
});
```

#### async

If your custom inline snapshot matcher is async i.e. uses `async`-`await` you might encounter an error like "Multiple inline snapshots for the same call are not supported". Jest needs additional context information to find where the custom inline snapshot matcher was used to update the snapshots properly.

```js
const {toMatchInlineSnapshot} = require('jest-snapshot');

expect.extend({
  async toMatchObservationInlineSnapshot(fn, ...rest) {
    // The error (and its stacktrace) must be created before any `await`
    this.error = new Error();

    // The implementation of `observe` doesn't matter.
    // It only matters that the custom snapshot matcher is async.
    const observation = await observe(async () => {
      await fn();
    });

    return toMatchInlineSnapshot.call(this, recording, ...rest);
  },
});

it('observes something', async () => {
  await expect(async () => {
    return 'async action';
  }).toMatchTrimmedInlineSnapshot();
  /*
  The snapshot will be added inline like
  await expect(async () => {
    return 'async action';
  }).toMatchTrimmedInlineSnapshot(`"async action"`);
  */
});
```

#### Bail out

Usually `jest` tries to match every snapshot that is expected in a test.

Sometimes it might not make sense to continue the test if a prior snapshot failed. For example, when you make snapshots of a state-machine after various transitions you can abort the test once one transition produced the wrong state.

In that case you can implement a custom snapshot matcher that throws on the first mismatch instead of collecting every mismatch.

```js
const {toMatchInlineSnapshot} = require('jest-snapshot');

expect.extend({
  toMatchStateInlineSnapshot(...args) {
    this.dontThrow = () => {};

    return toMatchInlineSnapshot.call(this, ...args);
  },
});

let state = 'initial';

function transition() {
  // Typo in the implementation should cause the test to fail
  if (state === 'INITIAL') {
    state = 'pending';
  } else if (state === 'pending') {
    state = 'done';
  }
}

it('transitions as expected', () => {
  expect(state).toMatchStateInlineSnapshot(`"initial"`);

  transition();
  // Already produces a mismatch. No point in continuing the test.
  expect(state).toMatchStateInlineSnapshot(`"loading"`);

  transition();
  expect(state).toMatchStateInlineSnapshot(`"done"`);
});
```

## Serializable properties

### `SERIALIZABLE_PROPERTIES`

Serializable properties is a set of properties that are considered serializable by Jest. This set is used to determine if a property should be serializable or not. If an object has a property that is not in this set, it is considered not serializable and will not be printed in error messages.

You can add your own properties to this set to make sure that your objects are printed correctly. For example, if you have a `Volume` class, and you want to make sure that only the `amount` and `unit` properties are printed, you can add it to `SERIALIZABLE_PROPERTIES`:

```js
import {SERIALIZABLE_PROPERTIES} from 'jest-matcher-utils';

class Volume {
  constructor(amount, unit) {
    this.amount = amount;
    this.unit = unit;
  }

  get label() {
    throw new Error('Not implemented');
  }
}

Volume.prototype[SERIALIZABLE_PROPERTIES] = ['amount', 'unit'];

expect(new Volume(1, 'L')).toEqual(new Volume(10, 'L'));
```

This will print only the `amount` and `unit` properties in the error message, ignoring the `label` property.

```bash
expect(received).toEqual(expected) // deep equality

Expected: {"amount": 10, "unit": "L"}
Received: {"amount": 1, "unit": "L"}
```
