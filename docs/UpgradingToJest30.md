---
id: upgrading-to-jest30
title: From v29 to v30
---

Upgrading Jest from v29 to v30? This guide aims to help refactoring your configuration and tests.

:::info

See [changelog](https://github.com/jestjs/jest/blob/main/CHANGELOG.md#3000) for the full list of changes.

:::

:::note

Upgrading from an older version? You can see the upgrade guide from v28 to v29 [here](/docs/upgrading-to-jest29).

:::

## Compatibility

- Jest 30 drops support for Node 14, 16, 19, and 21. The minimum supported Node versions are now 18.x. Ensure your environment is using a compatible Node release before upgrading.
- The minimum TypeScript version is now 5.4. Update TypeScript, if you are using type definitions of Jest (or any of its packages).
- The `jest-environment-jsdom` package now uses JSDOM v26. This update may introduce behavior changes in the DOM environment. If you encounter differences in DOM behavior or new warnings, refer to the JSDOM release notes for [v21–26](https://github.com/jsdom/jsdom/compare/21.0.0...26.0.0).

## Jest Expect & Matchers

### Removal of Alias Matcher Functions

All _alias_ matcher names have been removed in favor of their primary names. If you have been using older, deprecated matcher names, you will need to update your tests:

- **Removed aliases and their replacements:**
  - `expect(fn).toBeCalled()` **→** `expect(fn).toHaveBeenCalled()`
  - `expect(fn).toBeCalledTimes(n)` **→** `expect(fn).toHaveBeenCalledTimes(n)`
  - `expect(fn).toBeCalledWith(arg)` **→** `expect(fn).toHaveBeenCalledWith(arg)`
  - `expect(fn).lastCalledWith(arg)` **→** `expect(fn).toHaveBeenLastCalledWith(arg)`
  - `expect(fn).nthCalledWith(n, arg)` **→** `expect(fn).toHaveBeenNthCalledWith(n, arg)`
  - `expect(fn).toReturn()` **→** `expect(fn).toHaveReturned()`
  - `expect(fn).toReturnTimes(n)` **→** `expect(fn).toHaveReturnedTimes(n)`
  - `expect(fn).toReturnWith(val)` **→** `expect(fn).toHaveReturnedWith(val)`
  - `expect(fn).lastReturnedWith(val)` **→** `expect(fn).toHaveLastReturnedWith(val)`
  - `expect(fn).nthReturnedWith(n, val)` **→** `expect(fn).toHaveNthReturnedWith(n, val)`
  - `expect(func).toThrowError(message)` **→** `expect(func).toThrow(message)`

:::info

These alias methods were deprecated since Jest 26, and in Jest 30 they are fully removed. Perform a global search-and-replace in your codebase to update to the canonical matcher names. The functionality is identical — only the method names have changed. (If you use ESLint with `eslint-plugin-jest`, the [`no-alias-methods`](https://github.com/jest-community/eslint-plugin-jest/blob/HEAD/docs/rules/no-alias-methods.md) rule can help automate this replacement.)

:::

### Non-enumerable properties

Non-enumerable object properties are now excluded from object matchers by default. This could affect `expect.objectContaining` or equality checks.

### Improved Type Inference for CalledWith

TypeScript users: The types for the `CalledWith` family of matchers (e.g. `toHaveBeenCalledWith`) have been improved to infer function parameter types. In most cases this will catch type mismatches more accurately. This is a **compile-time** breaking change.

If you were asserting calls with arguments that don’t match the actual function’s parameter types, TypeScript may now error on those tests. For example, if a function is typed to accept a number and you wrote `expect(fn).toHaveBeenCalledWith("string")`, TypeScript 5 + Jest 30’s types will flag this. The runtime behavior of the matcher is unchanged.

To fix new TypeScript errors, ensure your test arguments align with the function’s expected types (or use type casts if you intentionally call with different types).

This change doesn’t impact runtime, but it can surface new type errors in your tests that were previously unnoticed, making your tests more type-safe.

## Configuration Updates

### Support for `.mts` and `.cts` File Extensions

Jest 30 expands support for ESM and TypeScript module file extensions:

- The default `moduleFileExtensions` now include `.mts` and `.cts` (TypeScript ESM and CommonJS modules) in addition to the usual extensions.
- The default `testMatch` and `testRegex` patterns have been updated to recognize `.mjs`, `.cjs`, `.mts`, and `.cts` files as test files.

:::info

If your project contains files with these extensions that are **not** intended to be treated as modules or tests, you may need to adjust your configuration. Conversely, if you have test files with these extensions, Jest will now detect them by default (you may remove custom configuration that was previously needed to include them).

:::

### `--testPathPattern` was renamed to `--testPathPatterns`

If you filter tests by path, note that the CLI flag has changed: The `--testPathPattern` flag is now `--testPathPatterns`. You can pass multiple patterns by separating them with spaces or by repeating the flag. For example:

```bash
# Old (Jest 29)
jest --testPathPattern="unit/.*"

# New (Jest 30)
jest --testPathPatterns "unit/.*" "integration/.*"
```

Internally, Jest consolidates these patterns into a `TestPathPatterns` object. If you were programmatically calling Jest’s watch mode with a `testPathPattern`, you must now construct a `TestPathPatterns` instance instead.

### Removed `--init` Command

The interactive config initialization command `jest --init` has been **removed**. This deprecated command was used to scaffold a Jest configuration file. If you need to create a config, you can run:

```bash
npm init jest@latest
# Or for Yarn
yarn create jest
# Or for pnpm
pnpm create jest
```

### Other CLI Changes

- Jest now validates CLI flags that require arguments to ensure an argument is provided. For example, if you use `--maxWorkers` or `--selectProjects`, you must include a value (e.g. `--maxWorkers=50%`). Previously, Jest might have allowed certain flags without a value (falling back to defaults); now it will throw an error if the value is missing. Ensure any scripts or npm commands passing Jest flags include the necessary arguments.
- If you use the `--filter` option to filter test files (an advanced use-case where you provide a path to a filter implementation), the expected interface has changed. The filter function should now return an object of shape `{filtered: Array<string>}`, matching the documented format. In prior versions, a different return format may have been accepted (e.g., returning an array directly). Update any custom test filter functions to return an object with a `filtered` property as documented.

## Test Runner Behavior Changes

### Unhandled Promise Rejections in Tests

Jest includes a fix to properly handle promises that are rejected and later caught, to avoid false test failures. In Jest 29, a promise rejection that was handled asynchronously (after the test tick) could still cause the test to fail erroneously. Jest 30 now waits an extra event loop turn to confirm that a promise rejection remains unhandled before failing a test.

:::info

You should see fewer false positives for unhandled promise rejections. Tests that previously failed due to async handled rejections should now pass. However, this change can slightly slow down test completion, especially in tests that intentionally reject promises. To mitigate performance impact, a new configuration flag `waitForUnhandledRejections` was introduced. This flag, when disabled, can restore the previous behavior (not waiting) if absolutely needed. Most users should not need to change this – the default now favors correctness by preventing false failures.

:::

### Custom Test Sequencers

If you have a **custom test sequencer** (a class inheriting from Jest’s `TestSequencer`), you’ll need to update it for Jest 30. Jest now passes additional context to the test sequencer. Specifically, the `TestSequencer` API was extended to expose the `globalConfig` and `contexts` to your sequencer.

### Required `globalConfig` in Runtime

For those using Jest’s programmatic APIs: constructing a `Runtime` now requires a `globalConfig` parameter. If you use `jest.runCLI` or similar helpers, make sure you pass all required options as per the updated API. (The typical `jest` CLI or `npm test` usage is unaffected by this change.)

## Snapshots and Output Changes

### Update broken documentation link

Deprecated goo.gl URL is removed from snapshot tests. This change updates existing snapshots to replace any goo.gl links with full, unshortened URLs.

### Error Causes in Snapshots

Error serialization in snapshots has changed. Jest 30’s snapshot serializer will now include an `Error`’s **`cause`** property (if present) when printing errors.

### React Empty String Rendering

The React-specific snapshot serializer no longer renders empty string children (`""`) in the output. In Jest 29, an empty string child in a React element might appear as `""` in the snapshot output; in Jest 30 it will be omitted (treated as no content).

### Improved Object Printing in `pretty-format`

`ArrayBuffer` and `DataView` are now printed in a human-readable way instead of as objects with internal fields.

## Jest Mock API Changes

### `jest.genMockFromModule` Removed

The legacy function `jest.genMockFromModule(moduleName)` has been removed. It was previously deprecated in favor of `jest.createMockFromModule(moduleName)`. If you still use `genMockFromModule`, switch to `createMockFromModule` – the behavior is the same. For example:

Old code (Jest 29):

```js
const mockFs = jest.genMockFromModule('fs');
```

New code (Jest 30):

```js
const mockFs = jest.createMockFromModule('fs');
```

### Removed Mock Function Types

:::info

The type changes are only applicable if you explicitly import Jest APIs:

```ts
import {expect, jest, test} from '@jest/globals';
```

:::

Some TypeScript types related to mock functions have been removed from the public API.

- `MockFunctionMetadata`
- `MockFunctionMetadataType`
- `SpyInstance`

If you were using `jest.SpyInstance` (for instance, to annotate the return of `jest.spyOn`), you should update to using [`jest.Spied`](./MockFunctionAPI.md#jestspiedsource).

### `jest.mock` only works with case-sensitive module path

`jest.mock()` will only work case-sensitive module path from now on. At best, this is an edge case since most users would follow OS filename pattern behavior. We recommend to use correctly named module path to avoid similar breakages in the future.

Old code (Jest 29):

```js
jest.mock('./path/to/FILENAME.js'); // This works EVEN when you only have `filename.js`
```

New code (Jest 30):

```js
jest.mock('./path/to/filename.js'); // This strictly works when you ONLY have `filename.js`
```

## Module & Runtime Changes

### ESM Module Support and Internal Restructuring

Jest has introduced significant under-the-hood changes to how its packages are bundled and exported:

- All of Jest’s internal modules are now bundled into single files for faster startup. This means when you install Jest, the number of files it loads is greatly reduced (improving performance). However, a side effect is that any unofficial deep imports into Jest’s packages will likely break. For example, if you previously did something like `require('jest-runner/build/testWorker')` (which is not a public API), this path will no longer exist. **Solution:** Use Jest’s public APIs or documented interfaces only. If you are relying on an internal module that you think should be part of the public API, please open a Pull Request to expose it.
- Jest’s packages now provide ESM wrappers. This is part of ongoing work to allow running Jest in an ESM context. All official Jest packages export themselves properly via the `package.json` `"exports"` field. For most users, this has no direct impact – you continue to use Jest the same way. But if you maintain a tool or plugin that imports Jest’s modules, ensure you use the package names as imports (which will resolve via Node’s module resolution).

These changes are considered breaking for anyone poking at Jest’s internals, but **not** for typical usage of the Jest CLI and config. After upgrading, run your tests normally – if you get module resolution errors related to Jest’s own modules, it’s likely due to an unsupported import that needs to be removed or updated.

### Glob Pattern Matching Changes

Jest’s dependency for file pattern matching (`glob`) has been upgraded to v10. Glob v10 may have slight differences in pattern syntax and behavior.

One notable change is that `glob@10` treats brace expansions and extglobs a bit differently and is stricter about some patterns. If you have custom `testMatch` patterns, `moduleNameMapper` patterns, or other glob-based config, they should continue to work in most cases. Just be aware that if a pattern isn’t matching files as it used to, you might need to adjust it for the new glob engine.

## Conclusion

Upgrade to Jest 30 by first ensuring your environment meets the new Node.js and TypeScript requirements. Update your Jest configuration file and CLI usage for the renamed and removed options (notably `testPathPatterns` and the removal of `--init`). Run your test suite and address any failures:

- Fix tests using removed matcher aliases by replacing them with the official matcher names.
- Update any snapshots that fail due to the formatting changes (error causes, empty strings, etc.).
- Pay attention to TypeScript compiler errors – they will guide you to update deprecated API usage (like `genMockFromModule` or removed types) and adjust tests where types are now stricter.

Happy testing!
