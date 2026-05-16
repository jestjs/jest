# `jest-haste-map` — agent notes

## What lives here

`jest-haste-map` crawls the file system, maintains an in-memory module map, and drives watch mode. `src/index.ts` is the orchestration entry point.

Key files to know:

- `lib/FileProcessor.ts` — `processFile` (worker dispatch, haste-id extraction, duplicate tracking) and `buildHasteMap` (initial build loop).
- `lib/CacheManager.ts` — v8 serialize/deserialize for the on-disk cache. **Sync I/O is intentional** — at haste-map's scale, async overhead adds no value and switching to `fs.promises` is not a free win.
- `lib/walk.ts` — shared `fdir`-backed directory walker used by the node crawler (`crawlers/node.ts` `find`), `FSEventsWatcher.ts` startup, and `NodeWatcher.js` startup (via `watchers/common.js` `recReaddir`). Exports `walk(opts, done): void` (callback-based) and `WalkOptions`, `WalkEntryKind`. Uses `fdir`'s `.withCallback()` API with a bounded callback-driven `lstat` pool (default `Math.max(os.availableParallelism() * 4, 32)` inflight). `fdir` is constructed with `new Fdir({fs})` so it uses `graceful-fs` for `readdir` — mock `graceful-fs.readdir` in tests to control directory traversal. `WalkOptions.statCache` is an optional `Map<string, Stats>` passed by callers that invoke `walk()` multiple times (e.g. once per root): a path already in the map skips its `lstat` call. **The cache must not be stored on watcher instances or passed to runtime (post-startup) walks** — stale stats would be returned for files changed after startup. `find()` and `WatcherDriver.start()` each create a fresh cache, use it for all per-root startup walks, then discard it.
- `watchers/ChangeQueue.ts` — 30 ms debounce, O(1) mtime-dedup via `Set<string>`, copy-on-write for the live map, file-processing dispatch.
- `crawlers/watchman.ts` — fb-watchman with clock-based incremental updates. `crawlers/node.ts` — `findNative` (`find(1)` shell-out) + `find` (`fdir` via `lib/walk`); `forceNodeFilesystemAPI` gates shell-out vs `fdir`.
- `watchers/types.ts` — `IWatcher`, `WatcherOptions`, `WatcherCtor`. New backends must implement `IWatcher` and accept `(root: string, opts: WatcherOptions)`.
- `watchers/WatchmanWatcher.js` — macOS/Linux watchman. `FSEventsWatcher.ts` — macOS native (startup walk via `lib/walk`). `NodeWatcher.js` — cross-platform fallback.

## Data model

`FileMetaData` is a positional 6-tuple; use the `H` constants from `src/constants.ts`:

| Index | Constant         | Value                          |
| ----- | ---------------- | ------------------------------ |
| 0     | `H.ID`           | haste module name              |
| 1     | `H.MTIME`        | mtime (ms)                     |
| 2     | `H.SIZE`         | file size                      |
| 3     | `H.VISITED`      | 0 = unprocessed, 1 = processed |
| 4     | `H.DEPENDENCIES` | NUL-delimited dep list string  |
| 5     | `H.SHA1`         | sha1 or null                   |

`InternalHasteMap.map` is `haste-id → {platform → [path, type]}`. `duplicates` tracks haste-id collisions. `clocks` persists watchman's incremental state.

## Hard rules

**Platform collision check is `=== 0`, not `=== 1`.** `FileProcessor` checks `Object.keys(moduleMap).length === 0` before deleting the whole module entry. The old `=== 1` incorrectly dropped surviving sibling entries. Don't revert it.

**`ChangeQueue` `stat` is required for add/change events.** The queue reads `stat.isDirectory()`, `stat.mtime.getTime()`, and `stat.size`. New watcher backends must supply `stat` (via `lstat` if the backend doesn't provide it). Delete events omit `stat` — that is correct.

**`WatchmanWatcher` ≠ parcel-watcher.** They both may use watchman internally but are independent codepaths. `WatchmanWatcher` stores clocks in `InternalHasteMap.clocks`; a `ParcelWatcher` would use parcel's opaque snapshot files.

**`useWatchman`, `enableSymlinks`, `forceNodeFilesystemAPI` are flat fields on `InternalOptions`**, copied directly from the `Options` input in the constructor. All decisions flow through `shouldUseWatchman(useWatchman)`.

**`enableSymlinks` guard** fires when `enableSymlinks && useWatchman`.

**`enableSymlinks` symlink semantics.** When `false` (default), symlinks are excluded by all walkers. When `true`: `find` (fdir path) passes `enableSymlinks` to `walk()`, which sets `excludeSymlinks: false` and keeps `resolveSymlinks: false` (fdir mode 2) — symlinks are included at their **original link path** (not realpath); `walk()` then calls `fs.stat` (follows the link) to get target stats (mtime/size). This preserves the path Jest uses to `require` the file while reporting the target's metadata. `findNative` (shell `find` path) uses `( -type f -o -type l )` when `enableSymlinks` is true to include symlinks, then `fs.stat`s each result. Do NOT set fdir's `resolveSymlinks: true` — it calls `realpath` and returns the resolved path, which would cause haste-map to track files under the wrong path.

**Config wiring from jest-config to jest-haste-map:** `HasteMap.Options` fields come from two places in `ProjectConfig`: `haste.enableSymlinks` → `enableSymlinks`, `haste.forceNodeFilesystemAPI` → `forceNodeFilesystemAPI`. The `useWatchman` field comes from the caller (e.g. `jest-runtime` passes `options?.watchman`; `jest-core` passes `globalConfig.watchman`). If you add a new `haste.*` config key that needs to reach `HasteMap`, add it to `HasteConfig` in `jest-types/src/Config.ts`, `HasteConfig` schema in `jest-schemas/src/raw-types.ts`, `Defaults.ts` (if it has a default), `ValidConfig.ts` (both `initialOptions.haste` and `initialProjectOptions.haste`), and the `HasteMap.create(...)` call in `jest-runtime/src/index.ts`.

## Tests

`src/__tests__/index.test.js` is the large integration suite — mocks `NodeWatcher`/`WatchmanWatcher`, drives events via `mockEmitters[root].emit('all', ...)`. Per-module tests live in `src/lib/__tests__/`, `src/watchers/__tests__/`, `src/crawlers/__tests__/`.
