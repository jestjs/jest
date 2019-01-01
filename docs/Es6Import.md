---
id: es6-import
title: ES6 Import
---

If you prefer the [Ava](https://ava.li/) approach of no polluting the global environment, Jest now supports importing as an ES6 module to avoid refering to global variables.

This is completely optional. Everything is still usable the same as before. But if you have a code editor that complains when you use unrecognized globals, or you just prefer to use the ES6 module approach, you can now import anything that is already defined as a global.

## Example

Consider the following example:

```js
test('it works', () => {
  expect('Hello, World!').toHaveLength(13);
});
```

This can now be rewritten as:

```js
import jest from 'jest';

jest.test('it works', () => {
  jest.expect('Hello, World!').toHaveLength(13);
});
```

## Reference

```js
import jest from 'jest';
```

The `jest` object now contains the following properties:

```
{
  expect
  afterAll
  afterEach
  beforeAll
  beforeEach
  describe
  describe.each
  describe.only
  describe.only.each
  describe.skip
  describe.skip.each
  test
  test.each
  test.only
  test.only.each
  test.skip
  test.skip.each
  clearAllTimers
  disableAutomock
  enableAutomock
  fn
  isMockFunction
  genMockFromModule
  mock
  unmock
  doMock
  dontMock
  clearAllMocks
  resetAllMocks
  restoreAllMocks
  resetModules
  retryTimes
  runAllTicks
  runAllTimers
  advanceTimersByTime
  runOnlyPendingTimers
  requireActual
  requireMock
  setMock
  setTimeout
  useFakeTimers
  useRealTimers
  spyOn
}
```

See [Expect API](ExpectAPI.md), [Global API](GlobalAPI.md), and [Jest Object API](JestObjectAPI.md) for more info.
