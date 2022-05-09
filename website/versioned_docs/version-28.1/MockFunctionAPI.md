---
id: mock-function-api
title: Mock Functions
---

Mock functions are also known as "spies", because they let you spy on the behavior of a function that is called indirectly by some other code, rather than only testing the output. You can create a mock function with `jest.fn()`. If no implementation is given, the mock function will return `undefined` when invoked.

:::info

The TypeScript examples from this page will only work as document if you import `jest` from `'@jest/globals'`:

```ts
import {jest} from '@jest/globals';
```

:::

## Methods

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(1)} />

---

## Reference

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

### `mockFn.getMockName()`

Returns the mock name string set by calling `mockFn.mockName(value)`.

### `mockFn.mock.calls`

An array containing the call arguments of all calls that have been made to this mock function. Each item in the array is an array of arguments that were passed during the call.

For example: A mock function `f` that has been called twice, with the arguments `f('arg1', 'arg2')`, and then with the arguments `f('arg3', 'arg4')`, would have a `mock.calls` array that looks like this:

```js
[
  ['arg1', 'arg2'],
  ['arg3', 'arg4'],
];
```

### `mockFn.mock.results`

An array containing the results of all calls that have been made to this mock function. Each entry in this array is an object containing a `type` property, and a `value` property. `type` will be one of the following:

- `'return'` - Indicates that the call completed by returning normally.
- `'throw'` - Indicates that the call completed by throwing a value.
- `'incomplete'` - Indicates that the call has not yet completed. This occurs if you test the result from within the mock function itself, or from within a function that was called by the mock.

The `value` property contains the value that was thrown or returned. `value` is undefined when `type === 'incomplete'`.

For example: A mock function `f` that has been called three times, returning `'result1'`, throwing an error, and then returning `'result2'`, would have a `mock.results` array that looks like this:

```js
[
  {
    type: 'return',
    value: 'result1',
  },
  {
    type: 'throw',
    value: {
      /* Error instance */
    },
  },
  {
    type: 'return',
    value: 'result2',
  },
];
```

### `mockFn.mock.instances`

An array that contains all the object instances that have been instantiated from this mock function using `new`.

For example: A mock function that has been instantiated twice would have the following `mock.instances` array:

```js
const mockFn = jest.fn();

const a = new mockFn();
const b = new mockFn();

mockFn.mock.instances[0] === a; // true
mockFn.mock.instances[1] === b; // true
```

### `mockFn.mock.contexts`

An array that contains the contexts for all calls of the mock function.

A context is the `this` value that a function receives when called. The context can be set using `Function.prototype.bind`, `Function.prototype.call` or `Function.prototype.apply`.

For example:

```js
const mockFn = jest.fn();

const boundMockFn = mockFn.bind(thisContext0);
boundMockFn('a', 'b');
mockFn.call(thisContext1, 'a', 'b');
mockFn.apply(thisContext2, ['a', 'b']);

mockFn.mock.contexts[0] === thisContext0; // true
mockFn.mock.contexts[1] === thisContext1; // true
mockFn.mock.contexts[2] === thisContext2; // true
```

### `mockFn.mock.lastCall`

An array containing the call arguments of the last call that was made to this mock function. If the function was not called, it will return `undefined`.

For example: A mock function `f` that has been called twice, with the arguments `f('arg1', 'arg2')`, and then with the arguments `f('arg3', 'arg4')`, would have a `mock.lastCall` array that looks like this:

```js
['arg3', 'arg4'];
```

### `mockFn.mockClear()`

Clears all information stored in the [`mockFn.mock.calls`](#mockfnmockcalls), [`mockFn.mock.instances`](#mockfnmockinstances), [`mockFn.mock.contexts`](#mockfnmockcontexts) and [`mockFn.mock.results`](#mockfnmockresults) arrays. Often this is useful when you want to clean up a mocks usage data between two assertions.

Beware that `mockFn.mockClear()` will replace `mockFn.mock`, not just reset the values of its properties! You should, therefore, avoid assigning `mockFn.mock` to other variables, temporary or not, to make sure you don't access stale data.

The [`clearMocks`](configuration#clearmocks-boolean) configuration option is available to clear mocks automatically before each tests.

### `mockFn.mockReset()`

Does everything that [`mockFn.mockClear()`](#mockfnmockclear) does, and also removes any mocked return values or implementations.

This is useful when you want to completely reset a _mock_ back to its initial state. (Note that resetting a _spy_ will result in a function with no return value).

The [`mockReset`](configuration#resetmocks-boolean) configuration option is available to reset mocks automatically before each test.

### `mockFn.mockRestore()`

Does everything that [`mockFn.mockReset()`](#mockfnmockreset) does, and also restores the original (non-mocked) implementation.

This is useful when you want to mock functions in certain test cases and restore the original implementation in others.

Beware that `mockFn.mockRestore()` only works when the mock was created with `jest.spyOn()`. Thus you have to take care of restoration yourself when manually assigning `jest.fn()`.

The [`restoreMocks`](configuration#restoremocks-boolean) configuration option is available to restore mocks automatically before each test.

### `mockFn.mockImplementation(fn)`

Accepts a function that should be used as the implementation of the mock. The mock itself will still record all calls that go into and instances that come from itself – the only difference is that the implementation will also be executed when the mock is called.

:::tip

`jest.fn(implementation)` is a shorthand for `jest.fn().mockImplementation(implementation)`.

:::

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js
const mockFn = jest.fn(scalar => 42 + scalar);

mockFn(0); // 42
mockFn(1); // 43

mockFn.mockImplementation(scalar => 36 + scalar);

mockFn(2); // 38
mockFn(3); // 39
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js
const mockFn = jest.fn((scalar: number) => 42 + scalar);

mockFn(0); // 42
mockFn(1); // 43

mockFn.mockImplementation(scalar => 36 + scalar);

mockFn(2); // 38
mockFn(3); // 39
```

</TabItem>
</Tabs>

`.mockImplementation()` can also be used to mock class constructors:

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js title="SomeClass.js"
module.exports = class SomeClass {
  method(a, b) {}
};
```

```js title="SomeClass.test.js"
const SomeClass = require('./SomeClass');

jest.mock('./SomeClass'); // this happens automatically with automocking

const mockMethod = jest.fn();
SomeClass.mockImplementation(() => {
  return {
    method: mockMethod,
  };
});

const some = new SomeClass();
some.method('a', 'b');

console.log('Calls to method: ', mockMethod.mock.calls);
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="SomeClass.ts"
export class SomeClass {
  method(a: string, b: string): void {}
}
```

```ts title="SomeClass.test.ts"
import {SomeClass} from './SomeClass';

jest.mock('./SomeClass'); // this happens automatically with automocking

const mockMethod = jest.fn<(a: string, b: string) => void>();
SomeClass.mockImplementation(() => {
  return {
    method: mockMethod,
  };
});

const some = new SomeClass();
some.method('a', 'b');

console.log('Calls to method: ', mockMethod.mock.calls);
```

</TabItem>
</Tabs>

### `mockFn.mockImplementationOnce(fn)`

Accepts a function that will be used as an implementation of the mock for one call to the mocked function. Can be chained so that multiple function calls produce different results.

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js
const mockFn = jest
  .fn()
  .mockImplementationOnce(cb => cb(null, true))
  .mockImplementationOnce(cb => cb(null, false));

mockFn((err, val) => console.log(val)); // true
mockFn((err, val) => console.log(val)); // false
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts
const mockFn = jest
  .fn<(cb: (a: null, b: boolean) => void) => void>()
  .mockImplementationOnce(cb => cb(null, true))
  .mockImplementationOnce(cb => cb(null, false));

mockFn((err, val) => console.log(val)); // true
mockFn((err, val) => console.log(val)); // false
```

</TabItem>
</Tabs>

When the mocked function runs out of implementations defined with `.mockImplementationOnce()`, it will execute the default implementation set with `jest.fn(() => defaultValue)` or `.mockImplementation(() => defaultValue)` if they were called:

```js
const mockFn = jest
  .fn(() => 'default')
  .mockImplementationOnce(() => 'first call')
  .mockImplementationOnce(() => 'second call');

mockFn(); // 'first call'
mockFn(); // 'second call'
mockFn(); // 'default'
mockFn(); // 'default'
```

### `mockFn.mockName(name)`

Accepts a string to use in test result output in place of `'jest.fn()'` to indicate which mock function is being referenced.

For example:

```js
const mockFn = jest.fn().mockName('mockedFunction');

// mockFn();
expect(mockFn).toHaveBeenCalled();
```

Will result in this error:

```
expect(mockedFunction).toHaveBeenCalled()

Expected mock function "mockedFunction" to have been called, but it was not called.
```

### `mockFn.mockReturnThis()`

Syntactic sugar function for:

```js
jest.fn(function () {
  return this;
});
```

### `mockFn.mockReturnValue(value)`

Accepts a value that will be returned whenever the mock function is called.

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js
const mock = jest.fn();

mock.mockReturnValue(42);
mock(); // 42

mock.mockReturnValue(43);
mock(); // 43
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts
const mock = jest.fn<() => number>();

mock.mockReturnValue(42);
mock(); // 42

mock.mockReturnValue(43);
mock(); // 43
```

</TabItem>
</Tabs>

### `mockFn.mockReturnValueOnce(value)`

Accepts a value that will be returned for one call to the mock function. Can be chained so that successive calls to the mock function return different values. When there are no more `mockReturnValueOnce` values to use, calls will return a value specified by `mockReturnValue`.

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js
const mockFn = jest
  .fn()
  .mockReturnValue('default')
  .mockReturnValueOnce('first call')
  .mockReturnValueOnce('second call');

mockFn(); // 'first call'
mockFn(); // 'second call'
mockFn(); // 'default'
mockFn(); // 'default'
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts
const mockFn = jest
  .fn<() => string>()
  .mockReturnValue('default')
  .mockReturnValueOnce('first call')
  .mockReturnValueOnce('second call');

mockFn(); // 'first call'
mockFn(); // 'second call'
mockFn(); // 'default'
mockFn(); // 'default'
```

</TabItem>
</Tabs>

### `mockFn.mockResolvedValue(value)`

Syntactic sugar function for:

```js
jest.fn().mockImplementation(() => Promise.resolve(value));
```

Useful to mock async functions in async tests:

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js
test('async test', async () => {
  const asyncMock = jest.fn().mockResolvedValue(43);

  await asyncMock(); // 43
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts
test('async test', async () => {
  const asyncMock = jest.fn<() => Promise<number>>().mockResolvedValue(43);

  await asyncMock(); // 43
});
```

</TabItem>
</Tabs>

### `mockFn.mockResolvedValueOnce(value)`

Syntactic sugar function for:

```js
jest.fn().mockImplementationOnce(() => Promise.resolve(value));
```

Useful to resolve different values over multiple async calls:

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js
test('async test', async () => {
  const asyncMock = jest
    .fn()
    .mockResolvedValue('default')
    .mockResolvedValueOnce('first call')
    .mockResolvedValueOnce('second call');

  await asyncMock(); // 'first call'
  await asyncMock(); // 'second call'
  await asyncMock(); // 'default'
  await asyncMock(); // 'default'
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts
test('async test', async () => {
  const asyncMock = jest
    .fn<() => Promise<string>>()
    .mockResolvedValue('default')
    .mockResolvedValueOnce('first call')
    .mockResolvedValueOnce('second call');

  await asyncMock(); // 'first call'
  await asyncMock(); // 'second call'
  await asyncMock(); // 'default'
  await asyncMock(); // 'default'
});
```

</TabItem>
</Tabs>

### `mockFn.mockRejectedValue(value)`

Syntactic sugar function for:

```js
jest.fn().mockImplementation(() => Promise.reject(value));
```

Useful to create async mock functions that will always reject:

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js
test('async test', async () => {
  const asyncMock = jest
    .fn()
    .mockRejectedValue(new Error('Async error message'));

  await asyncMock(); // throws 'Async error message'
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts
test('async test', async () => {
  const asyncMock = jest
    .fn<() => Promise<never>>()
    .mockRejectedValue(new Error('Async error message'));

  await asyncMock(); // throws 'Async error message'
});
```

</TabItem>
</Tabs>

### `mockFn.mockRejectedValueOnce(value)`

Syntactic sugar function for:

```js
jest.fn().mockImplementationOnce(() => Promise.reject(value));
```

Useful together with `.mockResolvedValueOnce()` or to reject with different exceptions over multiple async calls:

<Tabs groupId="examples">
<TabItem value="js" label="JavaScript">

```js
test('async test', async () => {
  const asyncMock = jest
    .fn()
    .mockResolvedValueOnce('first call')
    .mockRejectedValueOnce(new Error('Async error message'));

  await asyncMock(); // 'first call'
  await asyncMock(); // throws 'Async error message'
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts
test('async test', async () => {
  const asyncMock = jest
    .fn<() => Promise<string>>()
    .mockResolvedValueOnce('first call')
    .mockRejectedValueOnce(new Error('Async error message'));

  await asyncMock(); // 'first call'
  await asyncMock(); // throws 'Async error message'
});
```

</TabItem>
</Tabs>

## TypeScript Usage

:::tip

Please consult the [Getting Started](GettingStarted.md#using-typescript) guide for details on how to setup Jest with TypeScript.

:::

### `jest.fn(implementation?)`

Correct mock typings will be inferred, if implementation is passed to [`jest.fn()`](JestObjectAPI.md#jestfnimplementation). There are many use cases there the implementation is omitted. To ensure type safety you may pass a generic type argument (also see the examples above for more reference):

```ts
import {expect, jest, test} from '@jest/globals';
import type add from './add';
import calculate from './calc';

test('calculate calls add', () => {
  // Create a new mock that can be used in place of `add`.
  const mockAdd = jest.fn<typeof add>();

  // `.mockImplementation()` now can infer that `a` and `b` are `number`
  // and that the returned value is a `number`.
  mockAdd.mockImplementation((a, b) => {
    // Yes, this mock is still adding two numbers but imagine this
    // was a complex function we are mocking.
    return a + b;
  });

  // `mockAdd` is properly typed and therefore accepted by anything
  // requiring `add`.
  calculate(mockAdd, 1, 2);

  expect(mockAdd).toBeCalledTimes(1);
  expect(mockAdd).toBeCalledWith(1, 2);
});
```
