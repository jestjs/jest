# `jest-resolve` — agent notes

## Resolution order

`resolveModule(from, name)` tries, in order:

1. **`moduleNameMapper`** — first matching regex wins. On match, the mapped path **must** resolve or an error is thrown (unlike regular resolution which returns `null`). Supports `$1`/`$2` capture substitution and array fallbacks.
2. **Cache** — `_moduleNameCache` keyed by `(dir, name, options)`.
3. **Haste module** — `getModule(name)` against the haste map.
4. **`node_modules`** — via `defaultResolver` (`unrs-resolver`, a Rust-backed OXC resolver) or a user-supplied custom resolver.
5. **Haste package** — `package.json` files registered in the haste map.
6. **Throw `ModuleNotFoundError`** (carries `requireStack`, `hint`, `moduleName`).

## Key facts

**`defaultResolver` uses `unrs-resolver`** (OXC, Rust/WASM). The singleton lives in `fileWalkers.ts` and is `cloneWithOptions`-d per call. `Resolver.clearDefaultResolverCache()` flushes it plus `statSyncCached`/`readPackageCached` — call it in tests that mutate the filesystem.

**Custom resolvers** export `SyncResolver` (`(path, options) => string`), or `{sync, async}`. The `options` object includes `defaultResolver` and `defaultAsyncResolver` for fall-through. When only `async` is exported, `canResolveSync()` returns `false` and `EsmLoader` routes to the async path.

**`canResolveSync()`** is memoized on first call per `Resolver` instance. A throwing resolver module is treated as `false`.

**`shouldLoadAsEsm(path, extensionsToTreatAsEsm)`** checks extension (`.mjs` → always ESM, `.cjs` → never) then `package.json#type`. Results are cached; call `clearCachedLookups()` in tests that add/remove `package.json` files.

## Hard rules

- A `moduleNameMapper` match that can't be resolved always throws — there's no "try next strategy" fallback.
- `moduleNameMapper` is checked before haste and `node_modules`. If a mapper intercepts a name, the haste map is never consulted for it.
- Don't cache resolved paths across projects; `Resolver.clearDefaultResolverCache()` is process-global and clears all instances.
