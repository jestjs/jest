# `jest-snapshot` — agent notes

Loaded additively on top of root `CLAUDE.md` when working inside this package.

## What lives here

`jest-snapshot` implements the four snapshot matchers (`toMatchSnapshot`, `toMatchInlineSnapshot`, `toThrowErrorMatchingSnapshot`, `toThrowErrorMatchingInlineSnapshot`), the snapshot state machine, the serializer plugin chain, and the inline-snapshot AST patcher.

- `index.ts` (~550 lines) — the four matchers, plus exports (`addSerializer`, `getSerializers`, `EXTENSION`, `buildSnapshotResolver`, `SnapshotState`). Each matcher delegates to `SnapshotState`.
- `State.ts` (~330 lines) — `SnapshotState`: counters, the in-memory snapshot map, dirty tracking, `match()` / `save()`. One instance per test file.
- `InlineSnapshots.ts` (~175 lines) — `saveInlineSnapshots(snapshots, rootDir, prettierPath)`. Reads the source file, applies Babel-based replacements, runs prettier if configured (via a `synckit` worker), writes back. **Synchronous from the caller's perspective.**
- `utils.ts` (~430 lines) — `serialize`, `processInlineSnapshotsWithBabel` (the AST traversal that finds `toMatchInlineSnapshot(`...`)` template literals and patches them), `processPrettierAst`, line-break normalization. The Babel traversal is the hairiest code in the package.
- `plugins.ts` — the `pretty-format` plugin chain. Order matters; `addSerializer` prepends.
- `mockSerializer.ts` — built-in plugin that prints `[MockFunction]` etc. for `jest.fn()` values.
- `printSnapshot.ts` — diff/snapshot rendering for failure messages.
- `SnapshotResolver.ts` — maps test path → snapshot file path. Supports user-supplied `snapshotResolver` via `createTranspilingRequire`.
- `dedentLines.ts`, `colors.ts` — formatting helpers.
- `worker.ts` — `synckit`-worker entry that runs prettier in a child process (so prettier 2/3 differences are isolated from the main thread).
- `types.ts` — `Context` (the `MatcherContext` extension), `SnapshotMatchers`, `InlineSnapshot`, `SnapshotFormat`.

Some snapshot file I/O lives in the sibling `@jest/snapshot-utils` package (`getSnapshotData`, `saveSnapshotFile`, `keyToTestName`, `testNameToKey`, `escapeBacktickString`, `normalizeNewlines`).

## Hard rules

### Inline snapshot patching is synchronous — but prettier is async

`saveInlineSnapshots` is called synchronously at test teardown. Babel parsing and AST patching are sync. But prettier (user-supplied via `prettierPath`) is async in v3, so the worker proxy uses `synckit` to call into a worker thread and block until it returns. The blocking sync wrapper is `createSyncFn(require.resolve('./worker'))`.

Three implications:

1. **Don't `await` inside `saveInlineSnapshots`**. The whole function must complete before the test runner exits the file.
2. **The worker is per-prettier-path-cached** (`cachedPrettier` map). Don't re-instantiate it per call.
3. **Prettier 2 vs 3**: prettier 2 was sync; prettier 3 is async-only. The legacy sync path is preserved via `prettier-v2` types when the user's prettier resolves to v2. New code shouldn't reach for `prettier-v2` — it exists only to type the legacy code path.

### Snapshot file format invariants

Snapshot files (`*.snap`) are valid JavaScript modules: each snapshot is `exports['<test name> <counter>'] = '...';`. Format details enforced by `@jest/snapshot-utils`:

- Keys come from `testNameToKey(testName, counter)` — `${testName} ${counter}`.
- Multi-line snapshots are wrapped with extra leading/trailing newlines (see `addExtraLineBreaks` / `removeExtraLineBreaks`). Don't `trim()` — that would chew custom-serializer output.
- Backticks in values are escaped via `escapeBacktickString`.
- A header banner is required at the top so editors and `--ci` can detect the file. `saveSnapshotFile` writes it.

Don't touch the format unless you're prepared to migrate every existing `*.snap` file on disk — there's no version field.

### Inline-snapshot AST patching: matcher name list must match

`processInlineSnapshotsWithBabel(snapshots, sourceFile, snapshotMatcherNames)` finds the call sites by **matcher name** (looking for identifier `toMatchInlineSnapshot` etc. in `CallExpression.callee.property`). The set of names is:

```
['toMatchInlineSnapshot', 'toThrowErrorMatchingInlineSnapshot']
```

If a user has aliased a matcher via `expect.extend({mySnap: toMatchInlineSnapshot})`, the patcher won't find the call. This is intentional — the AST patcher can't generally know the user's alias mapping.

The traversal also recognizes `expect(x).toMatchInlineSnapshot()` (no arg → fresh snapshot to add) vs `expect(x).toMatchInlineSnapshot(\`...\`)`(existing). For the no-arg case it inserts a`TemplateLiteral`argument. For the existing case it overwrites`quasis[0].value.raw`.

Don't change the AST node kind: tests expect `TemplateLiteral` with a single `TemplateElement`. A `StringLiteral` would also work syntactically but breaks the user's prettier config (template-literal indent handling).

### `testFailing` semantics

When the test was declared with `.failing` (Circus's negative expectations), `toMatchSnapshot` accepts the snapshot mismatch as a **pass** — `State.match` short-circuits if `testFailing && !pass`. Don't propagate the comparison result without checking this flag, or `.failing` tests with snapshot assertions will report incorrectly.

### `--ci` behaviour

In CI mode, a snapshot that's **missing from the file** is a **failure** rather than a silent add. `State.match` reads `_updateSnapshot` (which is `'all' | 'new' | 'none'`) — `'none'` means "don't add, fail instead". `jest-config` maps `--ci` → `updateSnapshot: 'none'`. Don't add a code path that writes new snapshots when `_updateSnapshot === 'none'`.

### Stack-frame trimming via `__EXTERNAL_MATCHER_TRAP__`

`removeLinesBeforeExternalMatcherTrap` finds a marker function name (set by `expect`'s internal dispatcher) and trims the stack above it. This is what makes snapshot error stacks point at the user's `expect(...)` call rather than at internal expect machinery. The marker string is hard-coded — must stay in sync with `packages/expect/src/index.ts`.

## Serializer plugin chain

`getSerializers()` returns the current chain. **Order matters** — the first plugin that returns `true` from `test(val)` wins. Default order:

```
ReactTestComponent → ReactElement → DOMElement → DOMCollection
  → Immutable → jestMockSerializer → AsymmetricMatcher
```

`addSerializer(plugin)` **prepends** so the most recently added plugin has highest priority. This is the public contract `jest-runtime` exposes via `expect.addSnapshotSerializer` and `snapshotSerializers` config.

When adding a built-in plugin, prepend it consistently with priority — DOM plugins above generic Immutable, asymmetric matchers always last.

## State lifecycle

```
SnapshotState constructed at test-file start
  ↓
each matcher call → state.match({testName, received, isInline, ...})
  ↓ (counter++ for this testName)
  ↓ compare against stored snapshot, classify as {added, matched, unmatched, updated}
test file ends → state.save()
  ↓ write *.snap if dirty
  ↓ collect inline snapshots into a buffer
  ↓ saveInlineSnapshots(buffer, ...) — sync, AST-rewrites source files
```

`_dirty` tracks whether the in-memory snapshot map diverged from disk. `_uncheckedKeys` is "keys that exist on disk but weren't touched this run" — reported as obsolete unless the file was filtered (`--testNamePattern`).

## Tests

- `src/__tests__/*.test.ts` — runtime behaviour.
- `e2e/__tests__/inlineSnapshots*.test.ts`, `e2e/__tests__/snapshot*.test.ts` — round-trip tests that run Jest as a subprocess and inspect the on-disk results.
- `e2e/snapshot-*/` — fixtures.
- `__typetests__/` — TSTyche assertions for the matcher signatures.

## Related packages

- `@jest/snapshot-utils` — pure I/O and key/name helpers; no matcher logic.
- `pretty-format` — the value serializer. `plugins.ts` re-exposes plugins from there.
- `jest-matcher-utils` — diff rendering used by `printSnapshot.ts`.
- `@jest/transform` — `createTranspilingRequire` used by `SnapshotResolver` to load user-supplied resolvers.
