# `jest-haste-map` — agent notes

## What lives here

`jest-haste-map` crawls the file system, maintains an in-memory module map, and drives watch mode. `src/index.ts` is the orchestration entry point.

Key files to know:

- `lib/FileProcessor.ts` — `processFile` (worker dispatch, haste-id extraction, duplicate tracking) and `buildHasteMap` (initial build loop).
- `lib/CacheManager.ts` — v8 serialize/deserialize for the on-disk cache. **Sync I/O is intentional** — at haste-map's scale, async overhead adds no value and switching to `fs.promises` is not a free win.
- `lib/walk.ts` — shared `fdir`-backed directory walker used by the node crawler (`crawlers/node.ts` `find`). Exports `walk(opts, done): void` (callback-based) and `WalkOptions`, `WalkEntryKind`. `WalkOptions.statCache` is an optional `Map<string, Stats>` shared across per-root walks to skip redundant `lstat` calls. **Do not persist `statCache` beyond startup** — stale entries would be returned for files changed during the run. The sole call site (`find()`) creates a fresh cache and discards it after.
- `watchers/ChangeQueue.ts` — 30 ms debounce, O(1) mtime-dedup via `Set<string>`, copy-on-write for the live map, file-processing dispatch.
- `crawlers/watchman.ts` — fb-watchman with clock-based incremental updates. `crawlers/node.ts` — `findNative` (`find(1)` shell-out) + `find` (`fdir` via `lib/walk`); `forceNodeFilesystemAPI` gates shell-out vs `fdir`.
- `watchers/types.ts` — `IWatcher`, `WatcherOptions`, `WatcherCtor`. New backends must implement `IWatcher` and accept `(root: string, opts: WatcherOptions)`.
- `watchers/WatchmanWatcher.js` — watchman backend. `watchers/ParcelWatcher.ts` — `@parcel/watcher`-backed watcher used for all non-watchman paths; picks the native backend per platform (`fs-events`/`inotify`/`windows`; elsewhere the option is omitted so parcel resolves its own default). `opts.ignored` is handed to parcel's native matcher as a `RegExp`, which matches it against the path relative to the watched root — the same input `isFileIncluded` sees, but with **no leading separator**, so separator-anchored patterns never match the root's own entries (that is why the VCS globs are always appended, in both bare and `/**` forms). Only unflagged regexes qualify (parcel throws on any non-empty `.flags`), and sources C++ `std::regex` can't parse (lookbehind, named groups) reject at subscribe time — `ParcelWatcher` retries once without the regex. The in-process `_doIgnore`/`anymatch` check is the backstop in all fallback cases. Parcel's snapshot API (`writeSnapshot`/`getEventsSince`) is deliberately unused: nothing skips the fdir crawl, and replayed `create` events bypass `ChangeQueue`'s mtime dedup (it only applies to `change`), causing spurious re-runs at watch startup. Known gap (parity with the old `NodeWatcher`): moving a directory out of the tree emits one dir-level delete that the `**/*.<ext>` globs filter out, so contained files stay in the haste map until restart.

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

**`WatchmanWatcher` ≠ parcel-watcher.** They both may use watchman internally but are independent codepaths. `WatchmanWatcher` stores clocks in `InternalHasteMap.clocks`; `ParcelWatcher` keeps no persistent state.

**`useWatchman`, `enableSymlinks`, `forceNodeFilesystemAPI` are flat fields on `InternalOptions`**, copied directly from the `Options` input in the constructor. All decisions flow through `shouldUseWatchman(useWatchman)`.

**`enableSymlinks` guard** fires when `enableSymlinks && useWatchman`.

**`enableSymlinks`: never set fdir's `resolveSymlinks: true`.** It calls `realpath`, returning the resolved path — haste-map would then track the file under the wrong path. Symlinks must be included at their original link path; `walk()` uses `fs.stat` (follows the link) separately to get target metadata.

**Config wiring from jest-config to jest-haste-map:** `HasteMap.Options` fields come from two places in `ProjectConfig`: `haste.enableSymlinks` → `enableSymlinks`, `haste.forceNodeFilesystemAPI` → `forceNodeFilesystemAPI`. The `useWatchman` field comes from the caller (e.g. `jest-runtime` passes `options?.watchman`; `jest-core` passes `globalConfig.watchman`). If you add a new `haste.*` config key that needs to reach `HasteMap`, add it to `HasteConfig` in `jest-types/src/Config.ts`, `HasteConfig` schema in `jest-schemas/src/raw-types.ts`, `Defaults.ts` (if it has a default), `ValidConfig.ts` (both `initialOptions.haste` and `initialProjectOptions.haste`), and the `HasteMap.create(...)` call in `jest-runtime/src/index.ts`.

## Tests

`src/__tests__/index.test.js` is the large integration suite — mocks `ParcelWatcher`/`WatchmanWatcher`, drives events via `mockEmitters[root].emit('all', ...)`. Per-module tests live in `src/lib/__tests__/`, `src/watchers/__tests__/`, `src/crawlers/__tests__/`.
