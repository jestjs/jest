# `jest-environment-node` / `jest-environment-jsdom` — agent notes

Both implement the `JestEnvironment` interface from `@jest/environment`. Read this when writing a custom environment.

## The `JestEnvironment` interface

Key members every environment must provide:

- `global` — the VM context object. `jest-runtime` installs module globals here.
- `fakeTimers` / `fakeTimersModern` — created by the environment; both must be non-null (one will be used depending on `legacyFakeTimers` config).
- `getVmContext()` — returns the `node:vm` `Context`. Must return `null` after `teardown()`.
- `exportConditions()` — package.json export conditions for module resolution. Default: `customExportConditions` field.
- `handleTestEvent?(event, state)` — optional; receives every jest-circus event. Async handlers are awaited.
- `setup()` / `teardown()` — lifecycle hooks. `teardown()` is called even if `setup()` threw. Call `super.teardown()` when extending.

## `jest-environment-node` specifics

**Export conditions**: `['node', 'node-addons']` by default. Override via `testEnvironmentOptions.customExportConditions`.

**`GlobalProxy`**: The `global` object is a `Proxy`. Before `envSetupCompleted()` (end of constructor), property writes are not tracked. After it, newly assigned globals are tracked and deleted at teardown. This is how `jest-runtime`'s own globals survive while user-created globals are cleaned up.

**`globalsCleanup`**: `testEnvironmentOptions.globalsCleanup: 'soft' | 'aggressive'`. `'soft'` (default) deletes only post-setup properties. `'aggressive'` also clears pre-setup properties.

**Storage globals** (`localStorage`/`sessionStorage`): Installed as passthrough getters on Node 25+ to avoid warnings and prevent tracking by `GlobalProxy`.

## `jest-environment-jsdom` specifics

The concrete class is a thin wrapper over `jest-environment-jsdom-abstract`, which accepts the `jsdom` module as a constructor argument.

**Export conditions**: `['browser']` by default — resolves browser-oriented package.json `exports` entries.

**JSDOM versions**: The abstract class handles both JSDOM 26 (`virtualConsole.sendTo`) and JSDOM 27+ (`virtualConsole.forwardTo`).

## Per-file environment override

```js
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://example.com", "customExportConditions": ["browser"]}
 */
```

`jest-runner` extracts these via `jest-docblock` and merges `@jest-environment-options` into `testEnvironmentOptions` for that file only.

## Hard rules

- `getVmContext()` must return `null` after teardown — prevents module execution in a torn-down environment.
- Never share mutable state between environment instances — each test file gets its own instance.
- `teardown()` must be idempotent.
