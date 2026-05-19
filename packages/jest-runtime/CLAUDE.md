# `jest-runtime` — agent notes

## What lives here

`jest-runtime` is the module loader that runs user test code: resolution, mocking, ESM/CJS interop, the `jest` object, `@jest/globals`. The public class is `Runtime` (`src/index.ts` — DI wiring + public API + test-state machine + static factories). Everything else lives under `src/internals/`:

**State holders & caches**

- `TestState` — `'loading' | 'inTest' | 'betweenTests' | 'tornDown'` machine + `isTornDown()` / `isBetweenTests()` / `bailIfTornDown(msg)` / `throwIfTornDown(msg)` / `throwIfBetweenTests(msg)` helpers
- `MockState` — mock decisions, factories, virtual marks; also hosts `generateMock` (automock) at the bottom of the file
- `ModuleRegistries` — CJS/ESM/mock registries with an isolation overlay for `jest.isolateModules`
- `Resolution` — `jest-resolve` adapter with cjs/esm/manual-mock caches
- `TransformCache` / `FileCache` — code-transform and file-content caches
- `CjsExportsCache` — `cjs-module-lexer`-based static export analysis for CJS-as-ESM
- `V8CoverageCollector` — V8 coverage instrumentation

**Loaders & executors**

- `CjsLoader` — CJS require + manual-mock dispatch
- `EsmLoader` — ESM sync graph walker + legacy async path (one file; legacy block bracketed by a TODO header marking what deletes when min-Node ≥ v24.9)
- `ModuleExecutor` — `compileFunction` + module body invocation
- `RequireBuilder` / `CoreModuleProvider` — per-module `require` factory; core-module shimming
- `JestGlobals` — `@jest/globals` plumbing (`jest` object + test-runner globals)
- `TestMainModule` — shared cell for `require.main`

**Stateless helpers**

- `syntheticBuilders.ts`, `nodeCapabilities.ts`, `../helpers.ts`

## Hard rules

### Runtime is a public extension point

`Runtime` is documented as subclassable; downstream consumers override these methods:

- `requireModule`, `requireModuleOrMock`, `requireMock`, `requireActual`, `requireInternalModule`, `unstable_importModule`

Preserve their public signatures. **Any internal callback that "loads a module" must dispatch through these, never through a sibling internal directly.** E.g. wire `requireBuilder` with `requireDispatch: (from, name) => this.requireModuleOrMock(from, name)` — not `(from, name) => this.cjsLoader.requireModule(...)`. Subclass overrides flow through the public method, not around it.

### Capability gates stay glued to the body they guard

`internals/nodeCapabilities.ts` exports three gates:

- `runtimeSupportsVmModules` — `typeof SyntheticModule === 'function'` (Node 18+ with `--experimental-vm-modules`)
- `supportsSyncEvaluate` — Node 24.9+ (gates on `hasAsyncGraph`); required for the sync ESM graph walker
- `Resolution.canResolveSync()` — `false` when the user's configured resolver only exports an async hook

When moving a method that depends on a gate, carry the gate verbatim with the body it guards. Don't leave a comment in place of the runtime check; PR #16085 lost the `supportsSyncEvaluate` gate twice doing exactly that.

### VM module `status` invariants

Sync code paths must validate `vm.Module#status` before reuse:

- A `SourceTextModule` may live in a registry while still `'unlinked'` — the legacy async path stashes it before `link()` runs. Gate cache reuse on `module.status === 'evaluated'`.
- Rethrow `module.error` when `status === 'errored'`.
- For `'unlinked' | 'linking' | 'linked' | 'evaluating'`, bail (sync-preferred) or surface a typed error (sync-required).
- `requireEsmModule` (sync-required) must never `return null` for non-concurrency reasons — its caller turns `null` into the generic `ERR_REQUIRE_ESM` "concurrent import()" message. Resolver errors, missing factory, missing `moduleRequests` API, errored cache → throw a typed error or `invariant`.

### Mutex hygiene

`TransformCache.mutex` entries that aren't cleared after settle become permanent — every later sync-graph read of `hasMutex` returns `true` forever. Clear in `finally` after `transformResolve()` / `transformReject()`. Concurrent awaiters that grabbed the Promise reference before clear still see the rejection (the reference is independent of the Map entry).

## Tests

- Pick the appropriate test gate: `testWithVmEsm` for legacy-path tests (Node 18+ with `--experimental-vm-modules`); `testWithLinkedSyntheticModule` for sync-graph tests that need `linkRequests` (Node 22.21+/24.8+); `testWithSyncEsm` for sync-graph tests that need `hasAsyncGraph` (Node 24.9+). All come from `@jest/test-utils` (gate details in the root copilot-instructions.md).
- `internals/__tests__/` test files mirror production files 1:1; extend with new `describe` blocks rather than splitting. Their APIs are NOT a stability contract — change them in lockstep with the implementation.
