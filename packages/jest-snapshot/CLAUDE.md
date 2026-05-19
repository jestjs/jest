# `jest-snapshot` — agent notes

## What lives here

`jest-snapshot` implements the four snapshot matchers (`toMatchSnapshot`, `toMatchInlineSnapshot`, `toThrowErrorMatchingSnapshot`, `toThrowErrorMatchingInlineSnapshot`), the snapshot state machine, the serializer plugin chain, and the inline-snapshot AST patcher.

The non-obvious files:

- `State.ts` — `SnapshotState`: one instance per test file. `match()` is called per assertion; `save()` is called at teardown and triggers all on-disk writes.
- `InlineSnapshots.ts` — `saveInlineSnapshots(snapshots, rootDir, prettierPath)`. **Synchronous from the caller's perspective** even though it can call into prettier via a `synckit` worker.
- `utils.ts` — `processInlineSnapshotsWithBabel` is the AST traversal that finds `toMatchInlineSnapshot(`...`)` template literals and patches them. The hairiest code in the package.
- `worker.ts` — `synckit`-worker entry. Runs prettier in a child process so prettier 2 vs 3 differences are isolated from the main thread.
- `SnapshotResolver.ts` — maps test path → snapshot file path. Supports user-supplied `snapshotResolver` via `createTranspilingRequire`.

Snapshot file I/O (`getSnapshotData`, `saveSnapshotFile`, `keyToTestName`, `testNameToKey`, `escapeBacktickString`, `normalizeNewlines`) lives in the sibling `@jest/snapshot-utils`.

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

### Inline-snapshot AST patching

`processInlineSnapshotsWithBabel(snapshots, sourceFile, snapshotMatcherNames)` finds call sites by matcher name in `CallExpression.callee.property`. The `snapshotMatcherNames` array is populated by the traversal itself from names it discovers — but only those that literally appear at the call site. **A matcher imported under a different name from another module is invisible to the patcher**.

Two call-shape cases: `expect(x).toMatchInlineSnapshot()` (no arg → insert fresh `TemplateLiteral`) and `expect(x).toMatchInlineSnapshot(\`...\`)`(existing → overwrite`quasis[0].value.raw`).

Don't change the AST node kind. `TemplateLiteral` with a single `TemplateElement` is what tests assert. `StringLiteral` would syntactically work but breaks prettier's template-literal indent handling.

### `testFailing` semantics

When the test was declared with `.failing` (Circus's negative expectations), `toMatchSnapshot` accepts the snapshot mismatch as a **pass** — `State.match` short-circuits if `testFailing && !pass`. Don't propagate the comparison result without checking this flag, or `.failing` tests with snapshot assertions will report incorrectly.

### `--ci` behaviour

In CI mode, a snapshot that's **missing from the file** is a **failure** rather than a silent add. `State.match` reads `_updateSnapshot` (which is `'all' | 'new' | 'none'`) — `'none'` means "don't add, fail instead". `jest-config` maps `--ci` → `updateSnapshot: 'none'`. Don't add a code path that writes new snapshots when `_updateSnapshot === 'none'`.

### Stack-frame trimming via `__EXTERNAL_MATCHER_TRAP__`

`removeLinesBeforeExternalMatcherTrap` finds a marker function name (set by `expect`'s internal dispatcher) and trims the stack above it. This is what makes snapshot error stacks point at the user's `expect(...)` call rather than at internal expect machinery. The marker string is hard-coded — must stay in sync with `packages/expect/src/index.ts`.

### Serializer plugin order

`getSerializers()` returns the chain; the first plugin whose `test(val)` returns `true` wins. `addSerializer(plugin)` **prepends** so the most recently added plugin has highest priority. This is the public contract `jest-runtime` exposes via `expect.addSnapshotSerializer` and the `snapshotSerializers` config option. When adding a built-in plugin, position it consistently — DOM plugins above generic Immutable, `AsymmetricMatcher` always last.

## Tests

Round-trip behaviour is exercised by `e2e/__tests__/inlineSnapshots*.test.ts` and `e2e/__tests__/snapshot*.test.ts` — they run Jest as a subprocess and inspect the resulting `*.snap` files. If you change the AST patcher or the snapshot file format, those are the tests that catch real regressions; unit tests in `src/__tests__/` won't.
