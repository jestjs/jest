# `expect` — agent notes

Loaded additively on top of root `CLAUDE.md` when working inside this package.

## What lives here

`expect` is the assertion library. It exports a callable `expect(actual)` plus a small static API (`expect.extend`, `expect.assertions`, asymmetric matcher factories, `expect.getState`/`setState`).

- `index.ts` (~470 lines) — the `expect()` entry, `.resolves`/`.rejects` plumbing, `.not` wiring, `JestAssertionError`, `expect.extend` glue.
- `matchers.ts` (~1000 lines) — built-in matchers: `toBe`, `toEqual`, `toStrictEqual`, `toMatchObject`, `toContain`, `toHaveLength`, `toMatch`, `toBeCloseTo`, etc.
- `spyMatchers.ts` (~1300 lines) — call-related matchers: `toHaveBeenCalled`, `toHaveBeenCalledWith`, `toHaveBeenLastCalledWith`, `toHaveReturnedWith`, etc. Heaviest file because each matcher needs to format calls/returns nicely.
- `toThrowMatchers.ts` (~530 lines) — `toThrow` family + the snapshot-throw variants.
- `asymmetricMatchers.ts` (~430 lines) — `expect.any`, `expect.anything`, `expect.objectContaining`, `expect.arrayContaining`, `expect.arrayOf`, `expect.stringContaining`, `expect.stringMatching`, `expect.closeTo`. Plus the `AsymmetricMatcher` base class.
- `jestMatchersObject.ts` (~145 lines) — the **global registry**. Stores matchers + state + custom equality testers on `globalThis[Symbol.for('$$jest-matchers-object')]`. Houses `getState`/`setState`/`getMatchers`/`setMatchers`.
- `print.ts` — formatting helpers shared across matchers.
- `extractExpectedAssertionsErrors.ts` — turns `expect.assertions(n)` violations into surfaced errors.
- `types.ts` — `Expect`, `MatcherState`, `MatcherContext`, `MatchersObject`, `RawMatcherFn`, etc.

Most equality logic and shared helpers (`equals`, `iterableEquality`, `subsetEquality`) live in the sibling `expect-utils` package.

## Hard rules

### `jasmineUtils.ts` is vendored — keep the header, don't touch the algorithm

`packages/expect-utils/src/jasmineUtils.ts` is copied from Jasmine 2 (Pivotal Labs 2008–2016, MIT). It implements the core `equals(a, b, customTesters)` algorithm everything else builds on. The license header at the top must stay intact. Don't rewrite the algorithm — bug-for-bug compatibility with Jasmine's equals semantics is part of `expect`'s public contract.

If you need new equality behaviour, add a `Tester` (custom equality tester) instead of touching `equals` itself. See `packages/expect-utils/src/utils.ts` for `iterableEquality`, `subsetEquality`, etc., and the user-facing `expect.addEqualityTesters(...)` API.

### `expect` and `@jest/expect` must resolve to the same realm

The matcher registry is keyed by `Symbol.for('$$jest-matchers-object')` on `globalThis`. As long as the **same** `globalThis` is used, two requires of `expect` see the same matchers. But if two paths through jest-runtime's module registries each load `expect` afresh, you end up with two `JestAssertionError` constructors and matchers extend one set but not the other.

#16130 fixed exactly this: `jest-runtime` now resolves `expect` and `@jest/expect` from the _internal_ module registry so the test-file imports and the framework's own imports share state. When touching the matcher object registration, don't introduce module-level state that could diverge across realms — keep everything on `globalThis[JEST_MATCHERS_OBJECT]`.

### `JestAssertionError` carries `matcherResult`

When a matcher fails, the error thrown is a `JestAssertionError` whose `.matcherResult` carries the structured `{pass, message, actual, expected}` result. Reporters and IDE integrations read this field. Don't replace the thrown value with a plain `Error` — `matcherResult` is consumed downstream by `jest-circus`/`jest-jasmine2` for the failure summary and by `jest-message-util` for diff rendering.

### Asymmetric matchers must implement `asymmetricMatch`

`AsymmetricMatcher` is `abstract`; subclasses implement `asymmetricMatch(other)` and (for diff rendering) `toAsymmetricMatcher()` / `getExpectedType()`. The `equals` algorithm in `jasmineUtils` checks `a.$$typeof === Symbol.for('jest.asymmetricMatcher')` to dispatch. Adding a new matcher means subclassing `AsymmetricMatcher` and registering it on the `expect` namespace in `index.ts` (alongside `expect.any`, `expect.anything`, etc.).

`expect.extend({foo})` also generates an asymmetric variant automatically (`expect.foo(...)`) — see `setMatchers` in `jestMatchersObject.ts` where it does `class CustomMatcher extends AsymmetricMatcher` for each registered custom matcher.

### Sync vs async matcher dispatch

`expect(actual)` returns an `expectation` object with three branches:

- direct: `expect(x).toBe(y)` — sync, throws on failure.
- `.resolves` / `.rejects`: returns a Promise. The matcher runs against the awaited value. Both `.resolves.toThrow` and `.rejects.toThrow` exist with different semantics (see `getPromiseMatcher`).
- `.not`: inverts `pass`. Applied independently of `.resolves`/`.rejects`.

The stack-trace anchor matters: `makeThrowingMatcher` captures `err = new JestAssertionError()` at `expect()` call site **before** awaiting, so the thrown stack points at the user's `expect(...)` line, not at the internal Promise machinery. When adding a new wrapper, capture the outer `Error` synchronously.

### `INTERNAL_MATCHER_FLAG` controls stack-trace rewriting

Built-in matchers are marked with `Symbol.for('$$jest-internal-matcher')` (via `setMatchers(_, isInternal: true, _)`). `jest-circus`/`jest-jasmine2` use this flag to decide whether to rewrite stack frames in error output. User matchers from `expect.extend` are `isInternal: false` and keep their full stack. Don't strip the flag when copying matcher functions.

## Matcher implementation conventions

Every matcher is a function `(this: MatcherContext, received, ...args) => {pass: boolean, message: () => string}`:

- **Return both `pass` and `message`** — `message` is a thunk because building it is expensive and skipped on success.
- **Use `matcherHint` and `matcherErrorMessage`** from `jest-matcher-utils` for headers. Don't hand-roll the "Expected: / Received:" formatting — it'll skew from siblings.
- **Honour `this.isNot`** when composing the failure message (the dispatcher inverts `pass`, but the _message wording_ still needs the right voice).
- **Honour `this.promise`** (`'resolves' | 'rejects' | ''`) in the header so `.resolves.toThrow` failures don't pretend to be plain `.toThrow`.
- **Check `received` type early** and throw a structured `matcherErrorMessage` if it's wrong (e.g. `toThrow` on a non-function/non-promise).

The state on `this` (`MatcherContext`):

- `equals` — bound copy of `jasmineUtils.equals` carrying the user's custom testers.
- `customTesters` — array of `Tester` functions.
- `isNot`, `promise` — context for messages.
- `utils` — handle to `jest-matcher-utils` (formatting).
- `dontThrow()` — used by snapshot matchers that accumulate errors instead of throwing immediately.

## `expect.getState()` / `setState()`

Public per-test state for plugins (snapshot, spy matcher counts, `expect.assertions(n)` enforcement). The contract:

- `assertionCalls: number` — auto-incremented by every matcher dispatch.
- `expectedAssertionsNumber: number | null` — set by `expect.assertions(n)`.
- `isExpectingAssertions: boolean` — set by `expect.hasAssertions()`.
- `numPassingAsserts: number` — separate from `assertionCalls` (only-success count).
- `suppressedErrors: Array<Error>` — soft-failures from snapshot matchers in `dontThrow` mode.
- Test-runner-specific keys (`currentTestName`, `testPath`, `snapshotState`) added by `jest-jasmine2`/`jest-circus` per test.

`getState()` returns the live mutable object — readers see updates. Reset behaviour is the runner's responsibility, not `expect`'s.

## Tests

- `src/__tests__/*.test.{ts,js}` — runtime behaviour. A few are still `.js`. Some files (`matchers-toEqual.property.test.ts`, etc.) are property-based tests using `fast-check` arbitraries in `__arbitraries__/`.
- `__typetests__/` — TSTyche assertions for the matcher and `expect.extend` types. Update when changing public types.
- This package is in the `test-leak` matrix (`yarn test-leak`).

## Related packages

- `expect-utils` — `equals`, `Tester` infrastructure, `iterableEquality`, `subsetEquality`, immutable helpers.
- `jest-matcher-utils` — message formatting, `matcherHint`, `printExpected`/`printReceived`, `MatcherHintOptions`. Not imported here transitively but every matcher pulls it in.
- `@jest/expect` — re-export wrapper used by `jest-runtime` to ensure the `JestAssertionError` constructor identity is shared (see #16130).
- `jest-snapshot` — registers snapshot matchers via `expect.extend` (with `isInternal: true`).
