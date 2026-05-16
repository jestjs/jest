# Jest Repository — Coding Agent Instructions

Large monorepo (55 packages, 200+ e2e fixtures) managed with Lerna-lite and Yarn 4 (Berry, `node-modules` linker, not PnP). TypeScript everywhere, compiled with Webpack per package. Node engines `^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0`.

## Setup

```bash
corepack enable
yarn install        # ~45 s. Python is required (node-gyp).
yarn build:js       # ~5 s. Run this before tests — they import from build/, not src/.
```

Tests transform on the fly via `babel-jest`, but their `import {x} from '../'` resolves to each package's `build/`. `yarn build:js` is required after every checkout. Full `yarn build` (`build:js && build:ts && bundle:ts`) is 3–5 min and only needed when working on type declarations or API Extractor output.

Iterative: `yarn watch` (webpack), `yarn watch:ts` (declarations). Clean: `yarn build-clean`; full reset: `yarn clean-all`.

## Testing

```bash
yarn jest <path>                  # specific file or directory
yarn jest-runtime-vm-modules      # jest-runtime with --experimental-vm-modules (ESM tests)
yarn workspace <name> test        # one package
yarn jest-coverage                # with coverage
yarn jest-jasmine-ci              # CI mode with jasmine2 runner
yarn test-leak                    # detectLeaks across jest-mock/jest-diff/pretty-format
yarn test-types                   # tstyche (type-level tests in __typetests__/)
yarn test-ts                      # TypeScript-config integration tests (separate config)
yarn test-ci-partial:parallel --max-workers <N> --shard=<M>/<N>   # CI-mode sharded
```

- Default runner is `jest-circus` (`JEST_JASMINE=1` swaps to `jest-jasmine2`, kept for compat). Default timeout 70 s.
- Configs: `jest.config.mjs` (main), `jest.config.ci.mjs` (CI reporters), `jest.config.ts.mjs` (the `test-ts` integration).
- New test files are `.ts` (some legacy `.js` remain).
- Each `__tests__/` directory under packages covered by `yarn typecheck:tests` has its own `tsconfig.json` extending `tsconfig.test.json`. Add `"node"` to its `types` array when using Node globals like `Console`/`Stats`/`__dirname`.
- **`yarn typecheck:tests` is gated in CI** — must exit 0. Adding a new package's tests means appending it to the glob in `package.json`.
- **E2E tests (`e2e/__tests__/`) can't use `jest.mock`/`jest.fn`** — ESLint enforces this. Use fixture files instead.
- Some e2e tests need Mercurial: `brew install hg`.
- **Docblock pragmas** in test files: `@jest-environment <name>` overrides the test environment; `@jest-environment-options {"key": value}` merges into `testEnvironmentOptions`. Both are extracted by `jest-runner` and apply only to that file.

To run an e2e fixture manually:

```bash
cd e2e/<test-directory>
node ../../packages/jest-cli/bin/jest.js --no-cache
```

CI runs the test matrix with `nick-fields/retry` (10-min timeout, up to 3 retries on flake) across Ubuntu/macOS/Windows × Node 18/20/22/24/25. If a test is consistently failing locally but green in CI, suspect a retry-masked flake.

### Test gotchas worth memorizing

- **Windows CI on path-shaped assertions**: when comparing against a value built via `path.join`/`path.dirname`/`path.basename`, build the expected value with `path.join` too. Hardcoded POSIX strings (`'/path/to/x'`) fail on Windows.
- **Throwing-getter regression on `globalThis` scans**: iterating `Object.keys(scope)` and reading `scope[key]` crashes if a user installed a throwing getter. Use `'key' in scope` (the `has` trap, not `get`) as the gate.
- **ESM helpers from `@jest/test-utils`**: `testWithVmEsm` (Node 18+ with `--experimental-vm-modules`), `testWithLinkedSyntheticModule` (Node 22.21+/24.8+, gates on `linkRequests`), and `testWithSyncEsm` (Node 24.9+, gates on `hasAsyncGraph`). `yarn jest packages/jest-runtime` does **not** include the ESM suite — use `yarn jest-runtime-vm-modules`.

## Linting

Lint changed files after every edit:

```bash
yarn eslint --cache --fix <files>
```

Full lint (`yarn lint`) before pushing. ESLint 9.x flat config (`eslint.config.mjs`), with a local plugin at `.eslintplugin/index.mjs` providing `local/no-restricted-types-eventually`, `local/prefer-rest-params-eventually`, `local/prefer-spread-eventually`. Markdown code blocks are linted too.

### Hard rules (CI fails)

- **`graceful-fs`, never `fs`/`node:fs`** — both are banned by `no-restricted-imports`.
- **`globalThis`, never `global`** — banned by `no-restricted-globals`.
- **`node:` protocol** for Node built-ins in source files (`import * as path from 'node:path'`). **Exception**: `expect`, `expect-utils`, `jest-matcher-utils`, `jest-message-util`, `jest-pattern`, `jest-regex-util`, `jest-util` are consumed by webpack/browser bundles — they must NOT use `node:`. ESLint enforces this with `no-restricted-syntax` (see CHANGELOG #16167).
- **`sort-keys`** alphabetical in source. Off in tests.
- **`import-x/order`** alphabetical within groups (`builtin → external → internal → parent → sibling → index`, `newlines-between: never`). Auto-fix handles it.
- **No `Function` type, no `Boolean`/`Number`/`Object`/`String`/`Symbol` wrappers** — primitives only. Warned via `local/no-restricted-types-eventually`.
- **Copyright header** on every `.js`/`.ts`/`.tsx`/`.mjs`/`.cjs`:
  ```javascript
  /**
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  ```
  Enforced by `yarn check-copyright-headers`.

### Prettier

`bracketSpacing: false`, `singleQuote: true`, `trailingComma: 'all'`, `arrowParens: 'avoid'`. Let `yarn lint:prettier` rewrite — never hand-format.

## Mock typing patterns

Always typed:

```ts
jest.fn<typeof someFn>(); // explicit
jest.fn((arg: T) => result); // inferred from impl
const Mocked = X as jest.MockedClass<typeof X>; // module-mocked class
jest.mocked(obj.method).mockReturnValue(x); // typed cast for already-mocked
```

Never:

```ts
jest.fn().mockReturnValue(x); // widens to UnknownFunction
(x as jest.Mock).mockReturnValue(y); // cast soup
({foo: jest.fn()}) as unknown as Real; // construct typed instead
```

`beforeEach(() => jest.clearAllMocks())` fails `typecheck:tests` (return type widens). Use a block body: `beforeEach(() => { jest.clearAllMocks(); })`.

`mockClear()` resets call records only. `mockReset()` also clears implementations/return values. `mockRestore()` additionally restores the original (only meaningful for `spyOn`). The config options `clearMocks`/`resetMocks`/`restoreMocks` apply the corresponding operation before each test automatically.

Reference patterns live in `packages/jest-mock/__typetests__/mock-functions.test.ts` and `packages/jest-runtime/src/internals/__tests__/*.test.ts`.

## Code patterns

### Class extraction & DI

When a class has more than three deps, take a constructor options bag named `*Options` (not `*Deps`). One `private readonly x: T` field per dep — never a single `deps: Options` bag. Methods read fields directly (`this.resolution.resolveCjs(...)`, not `const {resolution} = this`). Initialize a field in the constructor body when its initializer closes over `this` or another field (declaration-time initializers run before the body and capture `undefined`).

Don't group unrelated deps into nested bags to shrink the arg count. If the bag gets long, the class is doing too much — decompose.

### Encapsulation

The encapsulation boundary that matters is "what the top-level consumer sees", not "every internal class has a pristine API". A composing class can own state-holder classes with looser file-local APIs. When a passthrough wrapper looks redundant, find a semantic alternative — don't fix it by exposing the private state it was hiding.

### Identifiers and comments

No abbreviated names: `requireFn` not `req`, `resolution` not `r`, `(from, name) => ...` not `(f, n) => ...`.

Default to no comments. Only justify a non-obvious WHY (hidden constraint, subtle invariant, workaround for a specific bug, surprising behaviour). Don't explain WHAT — names carry that. Don't reference current PRs/callers ("used by X", "see PR #16084") — those belong in PR descriptions and rot. When inserting a new declaration above an existing block, check the line above isn't a doc comment that would now bind to your declaration.

### Error handling

Use `isError` from `jest-util` to narrow thrown values — don't cast `e as Error`. Don't throw exceptions for control flow; prefer explicit capability predicates over try/catch-as-probe. Validate at system boundaries (user input, external APIs); trust internal code.

### Refactor PRs

Not obligated to be strictly behaviour-preserving — surfacing latent bugs is part of the value. Fix correctness issues inline, back them with regression tests. Don't amend commits during review; stack follow-ups as new commits. When a task spans multiple logical groups, one commit per group.

## How the pieces fit

A test run flows top-to-bottom through:

```
jest-cli         — CLI args
jest-config      — load + normalize user config (validated by jest-validate against jest-schemas)
jest-core        — orchestration: haste map, sequencing, worker spawning, output
jest-runner      — per-worker test execution
jest-runtime     — module loading, mocking, ESM/CJS interop, runs user code
jest-circus      — default test framework (jest-jasmine2 is the legacy alternative)
expect           — assertions; formats failures via jest-matcher-utils, jest-diff, pretty-format
jest-reporters   — final output (default, GitHub, junit, …)
```

Cross-cutting infrastructure used by multiple stages:

- `jest-haste-map` — file crawl + module map (Watchman or Node fs)
- `jest-resolve` — module resolution
- `@jest/transform` — transform pipeline; `babel-jest` is the default
- `jest-worker` — worker pool
- `jest-environment-node` / `jest-environment-jsdom` — VM context + globals
- `jest-mock` — `jest.fn`/`jest.spyOn` implementation
- `jest-fake-timers` — `jest.useFakeTimers()`
- `jest-snapshot` / `@jest/snapshot-utils` — snapshot matchers and file I/O
- `jest-watcher` — `--watch` UI/state
- `jest-changed-files` / `jest-resolve-dependencies` — `--onlyChanged`, `--onlyFailures`
- `jest-message-util` — stack trace + error formatting
- `jest-types`, `jest-util` — shared types and small utilities (`isError`, `invariant`, `deepCyclicCopy`, …)

Where to start by goal:

| Goal | Start in | Likely also touches |
| --- | --- | --- |
| Add/change a CLI flag | `jest-cli/src/args.ts` | `jest-config`, `jest-types` |
| Add/change a config option | `jest-schemas/src/raw-types.ts` + `jest-config/src/Descriptions.ts` | `jest-validate`, `jest-types`, `docs/Configuration.md` |
| Change a matcher | `expect/src/matchers.ts` (or `asymmetricMatchers.ts`, `spyMatchers.ts`) | `expect-utils`, `jest-matcher-utils` |
| Change snapshot behavior | `jest-snapshot/src/*.ts` | `@jest/snapshot-utils`, `pretty-format` |
| Change reporter output | `jest-reporters/src/<Reporter>Reporter.ts` | `jest-message-util`, `pretty-format` |
| Change module loading / mocking | `jest-runtime/src/index.ts` + `internals/` | `jest-resolve`, `jest-mock`, `@jest/transform` |
| Change module resolution | `jest-resolve/src/resolver.ts` + `defaultResolver.ts` | possibly `jest-runtime`, `jest-haste-map` |
| Change file crawl / watch | `jest-haste-map/src/crawlers/` or `watchers/` | `jest-worker` |
| Change transform pipeline | `@jest/transform/src/ScriptTransformer.ts` | individual transformers (`babel-jest`, etc.) |
| Change test-environment globals | `jest-environment-node` / `jest-environment-jsdom` | `jest-runtime` (consumer) |
| Change worker scheduling | `jest-runner/src/runTest.ts` + `testWorker.ts` | `jest-worker`, `@jest/test-sequencer` |
| Change timer mocking | `jest-fake-timers/src/*.ts` | `jest-runtime` (wiring) |
| Change mock function behavior | `jest-mock/src/index.ts` | `jest-runtime` (wiring) |

Tracing tips:

- A public-API behaviour change typically needs: code in the implementing package, types in `jest-types` + `jest-schemas`, normalization in `jest-config`, an e2e fixture under `e2e/` exercising the user-visible behaviour, and docs in `docs/`.
- `Runtime` (`jest-runtime/src/index.ts`) is documented as subclassable. Override seams: `requireModule`, `requireModuleOrMock`, `requireMock`, `requireActual`, `requireInternalModule`, `unstable_importModule`. Any internal callback that "loads a module" must dispatch through these — never call sibling internals directly.
- When `node:vm` semantics matter (sync vs async ESM), check `jest-runtime/src/internals/nodeCapabilities.ts` for the capability gates. Carry gates verbatim with the code they guard.

## Validation checklist before pushing

```bash
yarn build:js
yarn eslint --cache --fix <files>     # per edit during development
yarn lint                              # final check
yarn jest <affected>                   # or yarn jest --config jest.config.ci.mjs
yarn typecheck:tests                   # must exit 0
yarn check-changelog
yarn check-copyright-headers
yarn constraints
yarn dedupe --check
yarn verify-pnp
```

## Yarn constraints

`yarn.config.cjs` defines workspace constraints — same version of any dep across workspaces (except `@types/node`, pinned to `18.x` via `resolutions`), no dep in both `dependencies` and `devDependencies`, public packages need `license`/`repository`/`publishConfig`/`engines`, `main`/`types` start with `./`. Run `yarn constraints` to check, `yarn constraints --fix` to repair, `yarn dedupe --check` to catch duplicate versions.

When adding a new dep, use `yarn workspace <pkg> add <dep>` — constraints will reject mismatched versions across the monorepo.

## Common pitfalls

- **"Module not found" inside the repo's own packages**: forgot `yarn build:js`. Tests resolve via `main`, which points to `build/`.
- **Lockfile churn after `yarn install`**: commit it; CI uses `--immutable`.
- **`typecheck:tests` errors for a `Console`/`Stats`/`__dirname` reference**: add `"node"` to the test directory's `tsconfig.json` `types` array.
- **`execFile` mock typing**: heavily overloaded; the inner function won't satisfy `typeof execFile` directly. Use `((_file, _args, cb) => cb(null, ...)) as unknown as typeof execFile` on the impl cast.
- **Peer-dep warnings**: existing ones are expected, but new ones are not — resolve before merging.

## Changelog

User-visible changes need an entry under `## main` in `CHANGELOG.md`. Sections: **Features** / **Fixes** / **Chore & Maintenance**. Format:

```
- `[package-name]` Description ([#PR_NUMBER](https://github.com/jestjs/jest/pull/PR_NUMBER))
- `[jest-core, jest-cli]` Multi-package entries comma-separate the names ([#16100](...))
```

Alphabetize by first package name within each section. `yarn check-changelog` validates links. One logical change per commit; don't squash unrelated work.

## When in doubt

- Per-package `CLAUDE.md` files exist for: `expect`, `jest-circus`, `jest-config`, `jest-environment-node`, `jest-fake-timers`, `jest-haste-map`, `jest-mock`, `jest-reporters`, `jest-resolve`, `jest-runtime`, `jest-snapshot`, `jest-transform`, `jest-worker`. Read the relevant one for package-specific gotchas.
- Trust the code over this file. When something contradicts what you see, fix this file as part of your change.
