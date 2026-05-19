# `jest-fake-timers` — agent notes

## Two implementations

- **`ModernFakeTimers`** (default): backed by `@sinonjs/fake-timers` via `withGlobal(global)`. Created scoped to the test environment's global — not the host process global.
- **`LegacyFakeTimers`**: hand-rolled implementation, used only when `fakeTimers: {legacyFakeTimers: true}`. Mocks timer APIs with `jest.fn()`-based replacements. Does not support `setSystemTime`, async advance, or `advanceTimersToNextFrame`.

Both are instantiated in the environment constructor. `jest-runtime` routes `jest.useFakeTimers()` to the right one based on the `legacyFakeTimers` flag.

## Modern timers: non-obvious details

**`withGlobal(global)`** is called with the test environment's VM global, not `globalThis`. This scopes the sinon clock to that context so timer IDs don't bleed across environments.

**`useFakeTimers(config?)`** uninstalls any previous clock before installing a new one. Calling it with no args preserves the current `now` timestamp. Config options: `now` (initial time), `doNotFake` (array of API names to leave real, e.g. `['nextTick']`), `advanceTimers` (auto-advance), `legacyFakeTimers: false`.

**`runAllTimers()`** drains recursively — an infinite `setInterval` will hang. Use `runOnlyPendingTimers()` for intervals.

**`dispose()`** calls `useRealTimers()`. It's called by `environment.teardown()` automatically — don't call it manually unless you're implementing a custom environment.

**`now()` / `setSystemTime()`** only return/set fake time when fake timers are installed; otherwise they delegate to real `Date.now()`.
