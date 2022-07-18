---
id: upgrading-to-jest29
title: From v28 to v29
---

Upgrading Jest from v28 to v29? This guide aims to help refactoring your configuration and tests.

:::info

See [changelog](https://github.com/facebook/jest/blob/main/CHANGELOG.md#2900) for the full list of changes.

:::

## Compatibility

The supported Node versions are 14.15, 16.10, 18.0 and above.

## Snapshot format

As announced in the [Jest 28 blog post](/blog/2022/04/25/jest-28#future), Jets 29 has changed the default snapshot formatting to `{escapeString: false, printBasicPrototype: false}`.

If you want to keep the old behavior, you can set the `snapshotFormat` property to:

```diff
+ snapshotFormat: {
+   escapeString: true,
+   printBasicPrototype: true
+ }
```

## JSDOM upgrade

`jest-environment-jsdom` has upgraded `jsdom` from v19 to v20. Due to issues with `@types/jsdom`, if you extend this environment, you might run into type errors. See https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/60999#discussioncomment-3158685.

## `pretty-format`

`ConvertAnsi` plugin is removed in favour of [`jest-serializer-ansi-escapes`](https://github.com/mrazauskas/jest-serializer-ansi-escapes).
