# Jest Repository - Coding Agent Instructions

## Repository Overview

**Jest** is a delightful JavaScript testing framework with a focus on simplicity. It's a large monorepo (~1.2 GB) containing 55 packages managed with Lerna and Yarn Workspaces.

- **Primary Language**: TypeScript (compiled to JavaScript via Webpack + Babel)
- **Package Manager**: Yarn 4 (Berry with node-modules linker)
- **Node Version**: `^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0`
- **TypeScript**: v5.9.x in use; minimum tested compatibility is v5.4
- **Build Tools**: Webpack (JS bundles), TypeScript compiler (declarations), API Extractor (bundled types)
- **Monorepo Manager**: Lerna-lite
- **Main Packages**: Located in `packages/` (55 packages), e2e tests in `e2e/` (200+ test suites)

---

## Critical Setup & Build Instructions

### Initial Setup (REQUIRED — always run in this order)

1. **Enable Corepack** (if not already enabled):

   ```bash
   corepack enable
   ```

2. **Install dependencies** (always run this first):

   ```bash
   yarn install
   ```

   - Takes ~45 seconds
   - Use `yarn install --immutable` in CI or when pulling changes
   - Python is required (for node-gyp during install)
   - Existing peer dependency warnings are expected; do not introduce new ones

3. **Build the project** (required before running tests):

   ```bash
   yarn build:js
   ```

   - **Sufficient for most development work** (~5 seconds)
   - Unit tests run against built output in `packages/*/build/`, not source TypeScript. Test files themselves are transpiled on the fly by `babel-jest`, but their imports resolve to `build/` via each package's `"main"` field.
   - Full `yarn build` (3–5 minutes) is only needed when working on type declarations or API Extractor output.
   - Full build: `yarn build:js && yarn build:ts && yarn bundle:ts`
     - `build:js` — Webpack bundles each package to `build/`
     - `build:ts` — TypeScript compilation and `.d.ts` declaration files
     - `bundle:ts` — API Extractor creates bundled type definitions

### Development Workflow

Use watch mode for iterative development:

```bash
yarn watch          # rebuilds JS on file changes
yarn watch:ts       # rebuilds TypeScript declarations on file changes
```

Clean artifacts:

```bash
yarn build-clean    # removes build/, dist/, tsconfig.tsbuildinfo per package
yarn clean-all      # build-clean + removes all node_modules (full reset)
yarn clean-e2e      # removes e2e test artifacts only
```

---

## Testing

### Running Tests

**Run all tests** (10+ minutes):

```bash
yarn test           # yarn lint && yarn jest
```

**Run a specific test file** (most common during development):

```bash
yarn jest path/to/test.test.ts
# e.g.
yarn jest packages/jest-mock/src/__tests__/index.test.ts
```

**Run jest-runtime with ESM support** (needed for ESM-specific tests):

```bash
yarn jest-runtime-vm-modules
```

This passes `--experimental-vm-modules` to Node and runs only the `packages/jest-runtime` tests. Use when working on ESM internals.

**Run with coverage**:

```bash
yarn jest-coverage
```

**Run in CI mode** (sharded):

```bash
yarn test-ci-partial:parallel --max-workers <N> --shard=<M>/<N>
```

**Run specific workspace tests**:

```bash
yarn workspace jest-environment-node test
```

**Additional useful scripts**:

```bash
yarn test-leak              # detect memory leaks (jest-mock, jest-diff, pretty-format)
yarn jest-jasmine-ci        # CI mode with jasmine2 runner
yarn test-ts                # TypeScript config integration tests (jest.config.ts.mjs)
yarn test-with-type-info    # jest.config.ts e2e test with full type info
```

### Test Configuration

- Main config: `jest.config.mjs`
- CI config: `jest.config.ci.mjs` (adds junit and GitHub Actions reporters)
- TypeScript integration tests: `jest.config.ts.mjs`
- Default runner: `jest-circus`
- Default timeout: **70 000 ms** (70 seconds)
- Test files are excluded from `build/`, `__fixtures__/`, `__arbitraries__/`, `__benchmarks__/`, `__typetests__/`

### Environment Variables

- `JEST_JASMINE=1` — use jest-jasmine2 runner instead of jest-circus
- `GLOBALS_CLEANUP=off` — disable globals cleanup in test environment

### Test Directory Conventions

- **`src/__tests__/`** — unit tests for the package. One test file per production module; extend the existing `<Foo>.test.ts` with a new `describe`, don't split.
- **`src/internals/__tests__/`** — unit tests for internal sub-modules. The test file lives next to the production file. Internal class APIs change with refactors — these tests are NOT a stability contract; update them in lockstep. Don't add adapter shims to keep old test code working.
- **`__typetests__/`** — type-level tests using [TSTyche](https://tstyche.org/) (`expect<T>().type.toBe<U>()`). Run separately with `yarn test-types`, not by `yarn jest`.
- **`e2e/__tests__/`** — integration tests that execute Jest as a subprocess.
- **Cross-platform path assertions**: when asserting a value built via `path.join` / `path.dirname` / `path.basename`, derive the expected value with `path.join` too. Don't hardcode POSIX strings — Windows CI will fail.
- **ESM tests**: `yarn jest packages/jest-runtime` does NOT include ESM-only tests. Use `yarn jest-runtime-vm-modules` for the `--experimental-vm-modules` suite. Two helpers from `@jest/test-utils`: `testWithVmEsm` (Node 18+) and `testWithSyncEsm` (Node 22.21+ / 24.8+).

### E2E Tests

Located in `e2e/` (202 fixture directories):

- Tests execute Jest itself via `runJest.js` and assert on `status`, `stdout`, `stderr`
- **Do not use mocks in e2e test files** (enforced by ESLint — `jest/no-restricted-jest-methods`). Use fixture files in the corresponding `e2e/<name>/` directory instead.
- Each e2e fixture directory is a self-contained Jest project

**Running an e2e test manually**:

```bash
cd e2e/<test-directory>
node ../../packages/jest-cli/bin/jest.js --no-cache
```

**Note**: Some tests require Mercurial (`hg`). On macOS: `brew install hg`

---

## Linting & Code Quality

### Linting Commands

**During development — lint only changed files first**:

```bash
yarn eslint --cache --fix <file1> <file2> ...
```

Run this after every edit. It auto-fixes import order, formatting, and other fixable issues in seconds.

**Full lint** (1–2 minutes — use as final check before PR):

```bash
yarn lint           # eslint + prettier check across all JS/TS/MD files
```

**Lint TypeScript files with type information**:

```bash
yarn lint-ts-files
```

**Prettier**:

```bash
yarn lint:prettier        # auto-fix formatting
yarn lint:prettier:ci     # check only (used in CI)
```

### ESLint Configuration

Uses ESLint 9.x with flat config (`eslint.config.mjs`). Key enforced rules:

**Import rules (will fail CI)**:

- **`graceful-fs` instead of `fs` or `node:fs`** — both `'fs'` and `'node:fs'` are banned via `no-restricted-imports`. Always use `graceful-fs`.
- **`globalThis` instead of `global`** — `no-restricted-globals` bans `global`.
- **`sort-keys`** — object keys must be sorted alphabetically in source files (disabled in test files).
- **`import-x/order`** — imports must be sorted alphabetically within groups.

**Type rules (warnings, not errors yet)**:

- `local/no-restricted-types-eventually` — warns when using the boxed wrapper types `Boolean`, `Number`, `Object`, `String`, `Symbol`. Use the primitive types instead.
- `local/prefer-rest-params-eventually` — warns on `arguments`; prefer rest params.
- `local/prefer-spread-eventually` — warns on `.apply()`; prefer spread.

**Test file rules**:

- `sort-keys` is **off** in test files
- `jest/no-restricted-jest-methods` bans `jest.fn`, `jest.mock`, `jest.spyOn`, etc. in `e2e/__tests__/` (use fixtures instead)
- `unicorn/prefer-node-protocol` is **off** in test files (but use `node:` protocol in source)

**Node built-in imports**: In source files, import Node built-ins with the `node:` protocol prefix (`import * as path from 'node:path'`, `import {createHash} from 'node:crypto'`). This is convention across the codebase even though the unicorn rule is currently off.

### TypeScript Checks

**Typecheck test files** (checks `__tests__/` directories for specific packages):

```bash
yarn typecheck:tests
```

This runs `tsc -b` on the `__tests__/` directories of: `babel-jest`, `babel-plugin-jest-hoist`, `create-jest`, `diff-sequences`, `expect`, `expect-utils`, `jest-circus`, `jest-cli`, `jest-config`, `jest-console`, `jest-haste-map`, `jest-runtime`, `jest-snapshot`, `jest-util`, `jest-validate`, `jest-watcher`, `jest-worker`, `pretty-format`.

Each covered `__tests__/` directory has its own `tsconfig.json` that extends `tsconfig.test.json` and adds `"types": ["@jest/test-globals", "node"]`.

**Typecheck examples**:

```bash
yarn typecheck:examples
```

**Run type tests** (TSTyche — tests in `__typetests__/` directories):

```bash
yarn test-types
```

**Verify old TypeScript compatibility** (v5.4):

```bash
yarn verify-old-ts
```

---

## Yarn Constraints & Validation

Jest uses [Yarn Constraints](https://yarnpkg.com/features/constraints) (`yarn.config.cjs`):

```bash
yarn constraints          # check
yarn constraints --fix    # auto-fix
yarn dedupe --check       # verify no duplicate dependencies
yarn dedupe               # fix duplicates
```

Key constraints:

1. Same dependency version across all workspaces (except `@types/node`)
2. A package cannot appear in both `dependencies` and `devDependencies`
3. All public packages must have `license`, `repository`, `publishConfig`, and `engines` fields
4. `main` and `types` fields must start with `./`

---

## CI/CD Pipeline

### GitHub Actions Workflows (`.github/workflows/`)

**Main CI** (`nodejs.yml`) — runs on push to main, PRs, merge groups:

- **Static checks**: lint, typecheck, prettier, changelog validation, copyright headers, Yarn constraints
- **TypeScript compatibility**: tests with TS 5.4+, runs TSTyche type tests
- **Test matrix**: Ubuntu (4 shards) × macOS (3 shards) × Windows (4 shards) × Node LTS
- **Node version matrix** (separate job): 18.x, 20.x, 22.x, 24.x, 25.x on Ubuntu
- **ESM tests**: `jest-runtime` with `--experimental-vm-modules` across Node versions
- **Test leak detection**: `jest-mock`, `jest-diff`, `pretty-format`
- **Coverage**: 4 Ubuntu shards with codecov upload

**Test workflow** (`test.yml`) — reusable, called by main CI

**Other workflows**:

- `prepare-cache.yml` — prepares Yarn cache
- `pkg-pr-new.yml` — publishes installable package builds for every commit/PR via [pkg.pr.new](https://pkg.pr.new)
- `nightly.yml` / `test-nightly.yml` — nightly runs against latest Node
- `issues.yml` — auto-closes questions and bug reports without reproductions
- `close-stale.yml` — stale issue management
- `lock.yml` — locks closed issues

### Validation Checklist Before Pushing

```bash
yarn build:js                           # 1. build must succeed
yarn eslint --cache --fix <files>       # 2. lint changed files (fix issues)
yarn lint:prettier:ci                   # 3. formatting check
yarn jest --config jest.config.ci.mjs  # 4. tests must pass
yarn check-changelog                    # 5. CHANGELOG.md links valid
yarn check-copyright-headers            # 6. all source files have copyright header
yarn constraints                        # 7. workspace constraints pass
yarn dedupe --check                     # 8. no duplicate dependencies
yarn verify-pnp                         # 9. Yarn PnP compatibility
```

---

## Code Style & Conventions

### Required Copyright Header

All `.js`, `.ts`, `.tsx`, `.mjs`, `.cjs` source files must begin with:

```javascript
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
```

Enforced by `yarn check-copyright-headers` in CI.

### Code Formatting (Prettier)

```json
{
  "bracketSpacing": false,
  "proseWrap": "never",
  "singleQuote": true,
  "trailingComma": "all",
  "arrowParens": "avoid"
}
```

- **Indentation**: 2 spaces
- **Line length**: 80 characters (strongly preferred)
- **Quotes**: single quotes
- **Semicolons**: required
- **Trailing commas**: required everywhere (including function parameters)

### Object Key Ordering

Object keys must be sorted alphabetically in source files (`sort-keys` ESLint rule). This applies to type/interface definitions too. The rule is disabled in test files.

### Imports

- Sort imports alphabetically within each group (`import-x/order`)
- Use `node:` protocol for Node built-ins in source files (`node:path`, `node:fs`, `node:crypto`, etc.); the unicorn rule is off in test files, but the convention applies there too
- Never import `fs` directly — use `graceful-fs`
- Never use `global` — use `globalThis`

### TypeScript Style

- Use `strict: true` (enforced via tsconfig)
- `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` are all on
- Avoid boxed wrapper types (`Boolean`, `Number`, `Object`, `String`, `Symbol`) — use primitives
- Do not use `Function` type — use a specific function signature
- Use `jest.fn<typeof someFunction>()` for typed mocks, not bare `jest.fn()`
- Use `jest.mocked(x)` for typed access to mocked functions/classes
- Use `jest.MockedClass<typeof X>`, `jest.MockedFunction<typeof X>`, `jest.MockedObject<T>` for mock types

### Mock Patterns in Tests

Prefer typed mock construction over casts:

```ts
// Good
const mock = jest.fn<typeof someModule.doThing>().mockResolvedValue(result);
const MockClass = SomeClass as jest.MockedClass<typeof SomeClass>;

// Bad
const mock = jest.fn().mockReturnValue(x); // loses type info
(something as jest.Mock).mockReturnValue(x); // cast soup
const fake = {foo: jest.fn()} as unknown as RealType; // avoid if possible
```

---

## Code Patterns

### Class extraction & dependency injection

- For a class with more than three dependencies, take a constructor options bag — not positional args. Name the interface `*Options` (not `*Deps`):

  ```ts
  export interface FooBarOptions {
    foo: Foo;
  }

  export class FooBar {
    private readonly foo: Foo;
    constructor(options: FooBarOptions) {
      this.foo = options.foo;
    }
    doThing(): void {
      this.foo.work();
    }
  }
  ```

- One `private readonly x: T` field per dep — never a single `private readonly deps: FooBarOptions` bag.
- Methods read fields directly: `this.resolution.resolveCjs(...)`. Don't `const {resolution} = this;`.
- Initialize a field in the constructor body (not at declaration) when its initializer closes over `this` or another field — declaration-time initialization runs before the constructor body and can capture `undefined`.
- Don't group unrelated dependencies into nested bags (`hooks`, `esm`, `capabilities`) to shrink the argument count. If the bag gets long, the class is doing too much; decompose the class.

### Encapsulation across internals

The encapsulation boundary that matters is "what the top-level consumer sees", not "every internal class has a pristine API". A composing class can own state-holder classes with looser file-local APIs. When a passthrough wrapper looks redundant, find a semantic alternative — don't fix it by exposing the private state it was hiding.

### Identifier names

- No abbreviated identifiers: `requireFn` not `req`, `resolution` not `r`, `(from, name) => …` not `(f, n) => …`.

### Comments

- Default to no comments.
- Only add a comment when the WHY is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug, behavior that would surprise a reader.
- Don't explain WHAT the code does — well-named identifiers carry that.
- Don't reference the current PR, fix, or callers ("used by X", "added for the Y flow", "see PR #16084") — those belong in PR descriptions and rot in code.
- When inserting a new declaration above an existing block, check the line above isn't a doc comment that would now bind to your declaration.

### Error handling

- Use `isError` from `jest-util` to narrow thrown values: `if (isError(e)) { e.message }`. Don't cast `e as Error`.
- Don't throw exceptions for control flow. Prefer explicit capability predicates over try/catch-as-probe.
- Validate at system boundaries (user input, external APIs). Trust internal code — don't add defensive try/catch for scenarios that can't happen.

### Refactor PRs

- Refactor PRs are not obligated to be strictly behavior-preserving. Surfacing latent bugs is part of the value — fix correctness issues inline, back them with regression tests.
- Don't amend commits during review. Stack follow-up changes as new commits.
- When a single task spans multiple logical groups, use one commit per group.

---

## Project Structure

### Root Files

- `package.json` — monorepo root with all scripts
- `lerna.json` — Lerna-lite configuration (current version: 30.4.2)
- `babel.config.js` — Babel presets and plugins (used by `babel-jest` for test transpilation)
- `eslint.config.mjs` — ESLint 9 flat config
- `jest.config.mjs` — main Jest configuration
- `tsconfig.json` — TypeScript base config (`module: "preserve"`, `moduleResolution: "bundler"`, `strict: true`)
- `tsconfig.test.json` — extended config for test files (`noEmit: true`, `skipLibCheck: true`)
- `yarn.config.cjs` — Yarn constraints
- `.yarnrc.yml` — Yarn Berry configuration (node-modules linker)
- `.eslintplugin/index.mjs` — local ESLint plugin with `no-restricted-types-eventually`, `prefer-rest-params-eventually`, `prefer-spread-eventually`

### Key Directories

- **`packages/`** — all 55 Jest packages
- **`e2e/`** — 202 integration test fixture directories
- **`examples/`** — usage examples (React, Angular, TypeScript, etc.)
- **`scripts/`** — build and maintenance scripts
- **`website/`** — Docusaurus documentation site
- **`docs/`** — Markdown documentation
- **`.github/workflows/`** — CI/CD

### How the pieces fit

A test run flows through a small number of packages. Pick the right starting point by what you want to change.

**Pipeline (top → bottom):**

```
jest-cli           — parses CLI args, dispatches into jest-core
jest-config        — loads + normalizes user config
jest-validate      — config validation (jest-schemas defines the shape)
jest-core          — orchestrates: haste map, sequencing, worker spawning, output
jest-runner        — per-worker test execution
jest-runtime       — module loading, mocking, ESM/CJS interop inside a test file
jest-circus        — test framework (describe/it/beforeEach/…); default
  (or) jest-jasmine2  — legacy framework, kept for compatibility
expect / expect-utils — assertions; uses jest-matcher-utils, jest-diff,
                        pretty-format to format failures
jest-reporters     — final output formatting (default, GitHub, junit, etc.)
```

**Cross-cutting infrastructure** (used by multiple stages):

- `jest-haste-map` — file crawl + in-memory module map (Watchman or Node fs)
- `jest-resolve` — module resolution, consumed by `jest-runtime` and `jest-haste-map`
- `@jest/transform` — transformation pipeline; `babel-jest` is the default transformer
- `jest-worker` — worker pool used by `jest-runner`, `jest-haste-map`, others
- `jest-environment-node` / `jest-environment-jsdom` — VM context + globals; `jest-runtime` runs user code inside one
- `jest-mock` — mock-function implementation; `jest-runtime` wires `jest.fn`/`jest.spyOn` to it
- `jest-fake-timers` — timer mocking, exposed via `jest.useFakeTimers()`
- `jest-snapshot` / `jest-snapshot-utils` — snapshot matchers and file I/O
- `jest-watcher` — `--watch` mode UI and state
- `jest-changed-files` / `jest-resolve-dependencies` — `--onlyChanged`, `--onlyFailures`
- `jest-message-util` — stack trace + error formatting; used wherever errors surface
- `jest-types` — shared TypeScript types for config and globals
- `jest-util` — small shared utilities (`isError`, `invariant`, `deepCyclicCopy`, …)

**Where to start when…**

| Goal | Start in | Likely also touches |
| --- | --- | --- |
| Add/change a CLI flag | `jest-cli/src/cli/args.ts` | `jest-config`, `jest-types` |
| Add/change a config option | `jest-schemas/src/raw-types.ts` + `jest-config/src/Descriptions.ts` | `jest-validate`, `jest-types`, `docs/Configuration.md` |
| Change a matcher | `expect/src/matchers.ts` (or `asymmetricMatchers.ts`, `spyMatchers.ts`) | `expect-utils`, `jest-matcher-utils` |
| Change snapshot behavior | `jest-snapshot/src/*.ts` | `jest-snapshot-utils`, `pretty-format` |
| Change reporter output | `jest-reporters/src/<Reporter>Reporter.ts` | `jest-message-util`, `pretty-format` |
| Change module loading / mocking | `jest-runtime/src/index.ts` + `internals/` | `jest-resolve`, `jest-mock`, `@jest/transform` |
| Change module resolution | `jest-resolve/src/resolver.ts` + `defaultResolver.ts` | possibly `jest-runtime`, `jest-haste-map` |
| Change file crawl / watch | `jest-haste-map/src/crawlers/` or `watchers/` | `jest-worker` |
| Change transform pipeline | `@jest/transform/src/ScriptTransformer.ts` | individual transformers (`babel-jest`, etc.) |
| Change test-environment globals | `jest-environment-node` / `jest-environment-jsdom` | `jest-runtime` (consumer) |
| Change worker scheduling | `jest-runner/src/runTest.ts` + `testWorker.ts` | `jest-worker`, `@jest/test-sequencer` |
| Change timer mocking | `jest-fake-timers/src/*.ts` | `jest-runtime` (wiring) |
| Change mock function behavior | `jest-mock/src/index.ts` | `jest-runtime` (wiring) |

**Tracing tips:**

- Most public-API behavior changes need: code in the implementing package, types in `jest-types` + `jest-schemas`, normalization in `jest-config`, and docs in `docs/`.
- `Runtime` (`jest-runtime/src/index.ts`) is documented as subclassable. Override seams: `requireModule`, `requireModuleOrMock`, `requireMock`, `requireActual`, `requireInternalModule`, `unstable_importModule`. Any internal callback that "loads a module" must dispatch through these — never call sibling internals directly.
- When `node:vm` semantics matter (sync vs async ESM), check `jest-runtime/src/internals/nodeCapabilities.ts` for the current capability gates. Carry gates verbatim with the code they guard.

---

## Common Pitfalls & Workarounds

### Build Issues

1. **"Module not found" in tests**: Run `yarn build:js` — tests import from `build/`, which must exist
2. **TypeScript errors during build**: Often TS version mismatch warnings — safe to proceed if the build completes
3. **Build cache issues**: Run `yarn build-clean` then `yarn build:js`
4. **Full reset needed**: `yarn clean-all` removes build artifacts and all `node_modules`

### Test Issues

1. **"No tests found"**: Check `jest.config.mjs` `testPathIgnorePatterns` — `build/`, `__fixtures__/`, `__typetests__/` are excluded
2. **Tests timing out**: Default timeout is 70 000 ms — adjust per-test with `jest.setTimeout()` if needed
3. **E2E test failures**: Some tests require Mercurial (`hg`) — `brew install hg` on macOS
4. **ESM test failures**: Use `yarn jest-runtime-vm-modules` for `jest-runtime` ESM tests
5. **Windows CI failures on path-shaped assertions**: if a test compares against a hardcoded `/path/to/...` string, the production code may join paths with platform separators, producing `\path\to\...` on Windows. Build the expected value with `path.join` too.
6. **Throwing-getter regression risk on object scans**: when iterating `Object.keys(scope)` and reading `scope[key]`, a user-installed throwing getter on `globalThis` will crash the loop. Use `'someKey' in value` (goes through the `has` trap, not `get`) as a gate before any property read.

### TypeScript Checks

1. **`typecheck:tests` fails for a package not in the list**: Add the package's `__tests__/` tsconfig to `yarn typecheck:tests` glob in `package.json`
2. **Test file missing `Console` or `Stats` types**: Add `"node"` to the `"types"` array in the `__tests__/tsconfig.json` (alongside `"@jest/test-globals"`)
3. **`execFile` overload typing**: Node's `execFile` is heavily overloaded; use `as unknown as typeof execFile` on the mock implementation cast

### Workspace Issues

1. **Dependency conflicts**: `yarn constraints --fix` then `yarn dedupe`
2. **Lockfile modified unexpectedly**: Use `yarn install --immutable` in CI
3. **New peer dependency warnings introduced**: Resolve before merging — new warnings are not expected

---

## Making Changes

### Workflow

1. Fork and create a branch from `main`
2. `yarn install`
3. `yarn build:js`
4. Make changes; add/modify unit tests in `__tests__/` and/or e2e tests in `e2e/`
5. `yarn eslint --cache --fix <changed files>` after each edit
6. `yarn jest <path-to-affected-tests>` to verify
7. Update docs if changing public APIs
8. Add a changelog entry (see below)

### Changelog Format

All user-visible changes require an entry in `CHANGELOG.md` under `## main`, in the appropriate section:

- **Features** — new functionality
- **Fixes** — bug fixes
- **Chore & Maintenance** — refactoring, deps, docs, cleanup

Format: `` `[package-name]` Description ([#PR_NUMBER](link)) ``

Examples:

```
`[jest-config]` Add `defineConfig` helper ([#15844](...))
`[jest-core, jest-cli]` Fix sharding with coverage ([#16100](...))
```

Sort entries alphabetically by package name within each section. Add the PR number and link after the PR is open.

---

## Performance Considerations

- **`yarn build:js`**: ~5 seconds — do this, not full build, during development
- **Full `yarn build`**: 3–5 minutes
- **Full test suite**: 10+ minutes
- **Lint**: 1–2 minutes
- **Install**: ~45 seconds
- **Watch mode** (`yarn watch`): incremental rebuilds in seconds

Use sharding for faster CI:

```bash
yarn test-ci-partial:parallel --max-workers <N> --shard=1/4
```

---

## Additional Resources

- Docs: https://jestjs.io
- Contributing guide: `CONTRIBUTING.md`
- API reference: https://jestjs.io/docs/api
- GitHub: https://github.com/jestjs/jest
- Discord: https://discord.gg/j6FKKQQrW9
- Stack Overflow: https://stackoverflow.com/questions/tagged/jestjs
