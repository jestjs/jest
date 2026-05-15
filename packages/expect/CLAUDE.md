# `expect` — agent notes

## What lives here

`expect` is the assertion library: a callable `expect(actual)` plus a small static API (`expect.extend`, `expect.assertions`, asymmetric matcher factories, `expect.getState`/`setState`).

The load-bearing files:

- `index.ts` — `expect()` entry, `.resolves`/`.rejects` plumbing, `.not` wiring, `JestAssertionError`, `expect.extend` glue.
- `jestMatchersObject.ts` — the **global registry**. Stores matchers + state + custom equality testers on `globalThis[Symbol.for('$$jest-matchers-object')]`.
- `asymmetricMatchers.ts` — `AsymmetricMatcher` base class plus the built-in factories.
- `matchers.ts` / `spyMatchers.ts` / `toThrowMatchers.ts` — built-in matchers. Heavy files; each matcher needs careful formatting of call/return/diff output.

Most equality logic (`equals`, `iterableEquality`, `subsetEquality`) lives in the sibling `expect-utils` package. The user-facing `expect.addEqualityTesters(...)` extends what `equals` knows about — that's the supported extension point, not patching `equals` directly.

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

`expect(actual)` returns three branches: direct (sync, throws on failure), `.resolves`/`.rejects` (awaits then runs the matcher), and `.not` (inverts `pass`). The stack-trace anchor matters: `makeThrowingMatcher` captures `err = new JestAssertionError()` **before** awaiting, so the stack points at the `expect(...)` call site, not internal Promise machinery. Always capture the anchor error synchronously before any `await`.

### `INTERNAL_MATCHER_FLAG` controls stack-trace rewriting

Built-in matchers are marked with `Symbol.for('$$jest-internal-matcher')` (via `setMatchers(_, isInternal: true, _)`). `jest-circus`/`jest-jasmine2` use this flag to decide whether to rewrite stack frames in error output. User matchers from `expect.extend` are `isInternal: false` and keep their full stack. Don't strip the flag when copying matcher functions.

## When writing a matcher

Signature: `(this: MatcherContext, received, ...args) => {pass: boolean, message: () => string}`. A few non-obvious things:

- `message` is a **thunk** because building it is expensive and skipped on success — don't eagerly format.
- The dispatcher inverts `pass` for `.not`, but the message wording still needs the right voice — read `this.isNot` and adjust phrasing.
- The header must honour `this.promise` (`'resolves' | 'rejects' | ''`) so a `.resolves.toThrow` failure doesn't pretend to be plain `.toThrow`. `matcherHint` from `jest-matcher-utils` handles this when given the option object — use it; don't hand-roll headers.
- Type-check `received` early and throw a structured `matcherErrorMessage` if it's wrong (the canonical example is `toThrow` rejecting a non-function/non-promise).

`MatcherContext` carries `equals` (bound copy of `jasmineUtils.equals` with the user's custom testers baked in), `customTesters`, `isNot`, `promise`, `utils` (`jest-matcher-utils`), and `dontThrow()` (used by snapshot matchers that accumulate errors instead of throwing immediately).

## `expect.getState()` / `setState()`

Public per-test state used by snapshot, assertion counting, and the runner. Notable fields:

- `assertionCalls` — incremented per matcher dispatch; `expectedAssertionsNumber` is the budget set by `expect.assertions(n)`; `isExpectingAssertions` is the `expect.hasAssertions()` flag.
- `suppressedErrors` — soft-failures from snapshot matchers in `dontThrow` mode.
- `currentTestName`, `testPath`, `snapshotState` — added by the runner per test.

`getState()` returns the **live mutable object** — readers see updates. Reset behaviour is the runner's responsibility, not `expect`'s.

## Tests

Property-based tests in `src/__tests__/matchers-*.property.test.ts` use `fast-check` arbitraries from `__arbitraries__/`. When changing the public matcher or `expect.extend` types, update the assertions under `__typetests__/`.
