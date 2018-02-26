---
id: community-packages
title: Community Packages
---

Jest has a large community of packages out there in the wild, here's a list of
some of the popular packages to enhance your Jest experience:

## jest-extended

Additional Jest matchers including multiple APIs for different types including:

* Array
* Boolean
* Date
* Function
* Mock
* Number
* Object
* Promise
* String

### Example

`.toContainEntries([[key, value]])`

Use .toContainEntries when checking if an object contains all of the provided
entries.

```javascript
test('passes when object contains all of the given entries', () => {
  const o = {a: 'foo', b: 'bar', c: 'baz'};
  expect(o).toContainEntries([['a', 'foo']]);
  expect(o).toContainEntries([['c', 'baz'], ['a', 'foo']]);
  expect(o).not.toContainEntries([['b', 'qux'], ['a', 'foo']]);
});
```

You can find all of the available matchers `jest-extended` has to offer in the
[readme file](https://github.com/jest-community/jest-extended/blob/master/README.md).

## vscode-jest

The optimal flow for Jest based testing in VS Code

A comprehensive experience when using Facebook's Jest within a project.

* Useful IDE based Feedback
* Session based test watching

Find out how to install and setup `vscode-jest` in the
[readme file](https://github.com/jest-community/vscode-jest/blob/master/README.md).

## eslint-plugin-jest

ESLint plugin for Jest

Popular rules include:

* `jest/no-disabled-tests`
* `jest/no-focused-tests`
* `jest/no-identical-title`
* `jest/valid-expect`

You can find all of the available rules `eslint-plugin-jest` has to offer in the
[readme file](https://github.com/jest-community/eslint-plugin-jest/blob/master/README.md).

## jest-each

Data Driven Jest Testing

jest-each allows you to provide multiple arguments to your test/describe which
results in the test/suite being run once per row of data. _Supports skipping and
focussing tests_.

### Example data driven test

```javascript
import each from 'jest-each';

each([[1, 1, 2], [1, 2, 3], [2, 1, 3]]).test(
  'returns the result of adding %s to %s',
  (a, b, expected) => {
    expect(a + b).toBe(expected);
  },
);
```

Read the full documentation of `jest-each` in the
[readme file](https://github.com/mattphillips/jest-each/blob/master/README.md).

## babel-jest-assertions

Automatically add `expect.assertions(n)` and `expect.hasAssertions` to all tests
using babel

### Usage

Simply write your tests as you would normally and this plugin will add the
verification of assertions in the background.

```javascript
it('resolves to one', () => {
  Promise.reject(1).then(value => expect(value).toBe(1));
});
```

`↓ ↓ ↓ ↓ ↓ ↓`

```javascript
it('resolves to one', () => {
  expect.hasAssertions();
  expect.assertions(1);
  Promise.reject(1).then(value => expect(value).toBe(1));
});
```

Find out how to install and setup `babel-jest-assertions` in the
[readme file](https://github.com/mattphillips/babel-jest-assertions/blob/master/README.md).
