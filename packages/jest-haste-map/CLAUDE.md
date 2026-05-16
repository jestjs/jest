# `jest-haste-map` — agent notes

## What lives here

`jest-haste-map` crawls the file system, maintains an in-memory module map, and drives watch mode. `src/index.ts` is the orchestration entry point.

Key files to know:

- `lib/FileProcessor.ts` — `processFile` (worker dispatch, haste-id extraction, duplicate tracking) and `buildHasteMap` (initial build loop).
- `lib/CacheManager.ts` — v8 serialize/deserialize for the on-disk cache. **Sync I/O is intentional** — at haste-map's scale, async overhead adds no value and switching to `fs.promises` is not a free win.
- `watchers/ChangeQueue.ts` — 30 ms debounce, O(1) mtime-dedup via `Set<string>`, copy-on-write for the live map, file-processing dispatch.
- `crawlers/watchman.ts` — fb-watchman with clock-based incremental updates. `crawlers/node.ts` — pure Node.js fallback.
- `watchers/types.ts` — `IWatcher`, `WatcherOptions`, `WatcherCtor`, `WatcherBackend`. New backends must implement `IWatcher` and accept `(root: string, opts: WatcherOptions)`.
- `watchers/WatchmanWatcher.js` — macOS/Linux watchman. `FSEventsWatcher.ts` — macOS native. `NodeWatcher.js` — cross-platform fallback.

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

## Tests

`src/__tests__/index.test.js` is the large integration suite — mocks `NodeWatcher`/`WatchmanWatcher`, drives events via `mockEmitters[root].emit('all', ...)`. Per-module tests live in `src/lib/__tests__/`, `src/watchers/__tests__/`, `src/crawlers/__tests__/`.
