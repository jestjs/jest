---
id: asynchronous
title: Testing Asynchronous Code
---

It's common in JavaScript for code to run asynchronously. When you have code that runs asynchronously, Jest needs to know when the code it is testing has completed, before it can move on to another test. Jest has several ways to handle this.

## Promises

Return a promise from your test, and Jest will wait for that promise to resolve. If the promise is rejected, the test will fail.

For example, let's say that `fetchData` returns a promise that is supposed to resolve to the string `'peanut butter'`. We could test it with:

```js
test('the data is peanut butter', () => {
  return fetchData().then(data => {
    expect(data).toBe('peanut butter');
  });
});
```

## Async/Await

If you expect a promise to be rejected, use the `.catch` method. Make sure to add `expect.assertions` to verify that a certain number of [assertions](ExpectAPI.md#assertion-count) are called. Otherwise, a fulfilled promise would not fail the test.

```js
test('the data is peanut butter', async () => {
  const data = await fetchData();
  expect(data).toBe('peanut butter');
});

test('the fetch fails with an error', async () => {
  expect.assertions(1);
  try {
    await fetchData();
  } catch (error) {
    expect(error).toMatch('error');
  }
});
```

You can combine `async` and `await` with `.resolves` or `.rejects`.

```js
test('the data is peanut butter', async () => {
  await expect(fetchData()).resolves.toBe('peanut butter');
});

test('the fetch fails with an error', async () => {
  await expect(fetchData()).rejects.toMatch('error');
});
```

In these cases, `async` and `await` are effectively syntactic sugar for the same logic as the promises example uses.

:::caution

Be sure to return (or `await`) the promise - if you omit the `return`/`await` statement, your test will complete before the promise returned from `fetchData` resolves or rejects.

:::

If you expect a promise to be rejected, use the `.catch` method. Make sure to add `expect.assertions` to verify that a certain number of [assertions](ExpectAPI.md#assertion-count) are called. Otherwise, a fulfilled promise would not fail the test.

```js
test('the fetch fails with an error', () => {
  expect.assertions(1);
  return fetchData().catch(error => expect(error).toMatch('error'));
});
```

## Callbacks

If you don't use promises, you can use callbacks. For example, let's say that `fetchData`, instead of returning a promise, expects a callback, i.e. fetches some data and calls `callback(null, data)` when it is complete. You want to test that this returned data is the string `'peanut butter'`.

By default, Jest tests complete once they reach the end of their execution. That means this test will _not_ work as intended:

```js
// Don't do this!
test('the data is peanut butter', () => {
  function callback(error, data) {
    if (error) {
      throw error;
    }
    expect(data).toBe('peanut butter');
  }

  fetchData(callback);
});
```

The problem is that the test will complete as soon as `fetchData` completes, before ever calling the callback.

There is an alternate form of `test` that fixes this. Instead of putting the test in a function with an empty argument, use a single argument called `done`. Jest will wait until the `done` callback is called before finishing the test.

```js
test('the data is peanut butter', done => {
  function callback(error, data) {
    if (error) {
      done(error);
      return;
    }
    try {
      expect(data).toBe('peanut butter');
      done();
    } catch (error) {
      done(error);
    }
  }

  fetchData(callback);
});
```

If `done()` is never called, the test will fail (with timeout error), which is what you want to happen.

If the `expect` statement fails, it throws an error and `done()` is not called. If we want to see in the test log why it failed, we have to wrap `expect` in a `try` block and pass the error in the `catch` block to `done`. Otherwise, we end up with an opaque timeout error that doesn't show what value was received by `expect(data)`.

:::caution

Jest will throw an error, if the same test function is passed a `done()` callback and returns a promise. This is done as a precaution to avoid memory leaks in your tests.

:::

## `.resolves` / `.rejects`

You can also use the `.resolves` matcher in your expect statement, and Jest will wait for that promise to resolve. If the promise is rejected, the test will automatically fail.

```js
test('the data is peanut butter', () => {
  return expect(fetchData()).resolves.toBe('peanut butter');
});
```

Be sure to return the assertion—if you omit this `return` statement, your test will complete before the promise returned from `fetchData` is resolved and then() has a chance to execute the callback.

If you expect a promise to be rejected, use the `.rejects` matcher. It works analogically to the `.resolves` matcher. If the promise is fulfilled, the test will automatically fail.

```js
test('the fetch fails with an error', () => {
  return expect(fetchData()).rejects.toMatch('error');
});
```

None of these forms is particularly superior to the others, and you can mix and match them across a codebase or even in a single file. It just depends on which style you feel makes your tests simpler.
