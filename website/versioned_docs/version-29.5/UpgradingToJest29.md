---
id: upgrading-to-jest29
title: From v28 to v29
---

Upgrading Jest from v28 to v29? This guide aims to help refactoring your configuration and tests.

:::info

See [changelog](https://github.com/jestjs/jest/blob/main/CHANGELOG.md#2900) for the full list of changes.

:::

:::note

Upgrading from an older version? You can see the upgrade guide from v27 to v28 [here](/docs/28.x/upgrading-to-jest28).

:::

## Compatibility

The supported Node versions are 14.15, 16.10, 18.0 and above.

## Snapshot format

As announced in the [Jest 28 blog post](/blog/2022/04/25/jest-28#future), Jest 29 has changed the default snapshot formatting to `{escapeString: false, printBasicPrototype: false}`.

If you want to keep the old behavior, you can set the `snapshotFormat` property to:

```diff
+ snapshotFormat: {
+   escapeString: true,
+   printBasicPrototype: true
+ }
```

## JSDOM upgrade

`jest-environment-jsdom` has upgraded `jsdom` from v19 to v20.

:::info

If you use `jest-environment-jsdom`, the minimum TypeScript version is set to `4.5`.

:::

Notably, `jsdom@20` includes support for `crypto.getRandomValues()`, which means packages like `uuid` and `nanoid`, which doesn't work properly in Jest@28, can work without extra polyfills.

## `pretty-format`

`ConvertAnsi` plugin is removed from `pretty-format` package in favour of [`jest-serializer-ansi-escapes`](https://github.com/mrazauskas/jest-serializer-ansi-escapes).

### `jest-mock`

Exports of `Mocked*` utility types from `jest-mock` package have changed. `MaybeMockedDeep` and `MaybeMocked` now are exported as `Mocked` and `MockedShallow` respectively; only deep mocked variants of `MockedClass`, `MockedFunction` and `MockedObject` are exposed.

## TypeScript

import TypeScriptExamplesNote from './_TypeScriptExamplesNote.md';

<TypeScriptExamplesNote />

### `jest.mocked()`

The [`jest.mocked()`](MockFunctionAPI.md/#jestmockedsource-options) helper method now wraps types of deep members of passed object by default. If you have used the method with `true` as the second argument, remove it to avoid type errors:

```diff
- const mockedObject = jest.mocked(someObject, true);
+ const mockedObject = jest.mocked(someObject);
```

To have the old shallow mocked behavior, pass `{shallow: true}` as the second argument:

```diff
- const mockedObject = jest.mocked(someObject);
+ const mockedObject = jest.mocked(someObject, {shallow: true});
```
