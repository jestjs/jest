# `jest-haste-map` — agent notes

## What lives here

`jest-haste-map` crawls the file system, maintains an in-memory module map, and drives watch mode. `src/index.ts` is the orchestration entry point; all logic lives in focused modules:

**Library modules (`src/lib/`)**

- `FileProcessor.ts` — `processFile` (worker dispatch, haste-id extraction, duplicate tracking) and `buildHasteMap` (initial build loop). Owns `DuplicateError`.
- `CacheManager.ts` — v8 serialize/deserialize for the on-disk cache. Reads and writes are synchronous by design; at haste-map's scale this avoids microtask overhead that async I/O would add with no offsetting gain.
- `WorkerPool.ts` — `jest-worker` lifecycle wrapper.
- `buildIgnoreMatcher.ts` — constructs the `IgnoreMatcher` function from `ignorePattern` + standard patterns. Called once at construction and on watch re-init.
- `util.ts` — `copy`, `copyMap`, `createEmptyMap`.
- `isWatchmanInstalled.ts` — async one-shot probe; result is module-scoped-cached.

**Crawlers (`src/crawlers/`)**

- `watchman.ts` — fb-watchman query with clock-based incremental updates. Persists clocks in `InternalHasteMap.clocks`.
- `node.ts` — pure Node.js walker via the `walker` npm package.
- `index.ts` — driver: tries watchman, retries with node on failure.

**Watchers (`src/watchers/`)**

- `index.ts` — `WatcherDriver` class + `shouldUseWatchman()`. Manages per-root backend instances, ready-timeout, and `Promise.allSettled`-based startup with partial-failure cleanup.
- `ChangeQueue.ts` — 30 ms debounce, O(1) mtime-dedup via `Set<string>`, copy-on-write for the live haste map, file-processing dispatch, and the `emit('change', ...)` call.

**Watcher backends (`src/watchers/`)**

- `WatchmanWatcher.js` — direct `fb-watchman` integration (not the same as parcel-via-watchman).
- `FSEventsWatcher.ts` — macOS native `fsevents`.
- `NodeWatcher.js` — cross-platform fallback (vendored from `sane`).
- `common.js` — `isFileIncluded`, `assignOptions`, event-type constants.
- `RecrawlWarning.js` — watchman-internal warning tracker.

**Types & public API**

- `src/types.ts` — all exported types. `FileMetaData` is a positional tuple; use the `H` constants for indices.
- `src/index.ts` — `JestHasteMap` class (the public entry point), re-exports, static helpers.

## Data model

`InternalHasteMap` is the live mutable map:

```ts
{
  clocks: WatchmanClocks; // watchman incremental state
  duplicates: DuplicatesIndex; // haste-id → platform → path → type
  files: FileData; // path → FileMetaData tuple
  map: ModuleMapData; // haste-id → { platform → [path, type] }
  mocks: MockData; // mock name → path
}
```

`FileMetaData` is a 6-tuple; use the `H` constants from `src/constants.ts`:

| Index | Constant         | Value                          |
| ----- | ---------------- | ------------------------------ |
| 0     | `H.ID`           | haste module name              |
| 1     | `H.MTIME`        | mtime (ms)                     |
| 2     | `H.SIZE`         | file size                      |
| 3     | `H.VISITED`      | 0 = unprocessed, 1 = processed |
| 4     | `H.DEPENDENCIES` | NUL-delimited dep list string  |
| 5     | `H.SHA1`         | sha1 or null                   |

## Hard rules

### Platform collision: `=== 0`, not `=== 1`

`FileProcessor.ts` removes a colliding platform entry and then checks whether the whole module entry should be deleted. The check is `Object.keys(moduleMap).length === 0` — delete only when **no platforms remain**. The old code had `=== 1` which incorrectly dropped surviving sibling entries. Don't revert it.

### `ChangeQueue` `stat` requirement

Every `'add'`/`'change'` event arriving at `ChangeQueue.onChange` **must** carry a `stat` object (`fs.Stats`). The queue reads `stat.isDirectory()`, `stat.mtime.getTime()`, and `stat.size`. Any new watcher backend must supply `stat` (via `lstat` if the backend doesn't provide it natively). `'delete'` events omit `stat` — that is expected and correct.

### Watchman ≠ parcel-via-watchman

`WatchmanWatcher` talks directly to `fb-watchman` and stores clocks in `InternalHasteMap.clocks` for incremental crawling. A future `ParcelWatcher` may use watchman internally too, but will use parcel's opaque snapshot files — the two codepaths are independent. Don't conflate them.

### Sync cache I/O is intentional

`CacheManager` uses `readFileSync` / `writeFileSync`. This is deliberate — switching to `fs.promises` is not a free win here. At haste-map's scale (potentially hundreds of thousands of entries), sync I/O avoids microtask scheduling overhead, and nothing productive happens while waiting for the cache anyway. Don't change it without measurement.

## Watch-mode startup sequence

```
HasteMap.build()
  → _crawl()                    calls crawlers/index.ts
  → processFiles()               uses FileProcessor
  → CacheManager.persist()
  → _watch()
      ChangeQueue.start()        begins 30 ms interval
      WatcherDriver.start()      per-root backends
        _createWatcher()         await 'ready', then subscribe 'all'
```

If `WatcherDriver.start()` throws, `ChangeQueue.stop()` is called before re-throwing so the interval doesn't leak. If one root's watcher fails to start, already-started sibling watchers are closed (via `Promise.allSettled`) before the `AggregateError` propagates.

## Tests

`src/__tests__/index.test.js` is the large integration suite — mocks both `NodeWatcher` and `WatchmanWatcher`, then drives events via `mockEmitters[root].emit('all', ...)`. Find the watcher-mock and watch-mode blocks by name; line numbers rot.

Per-module unit tests live in `src/lib/__tests__/`, `src/watchers/__tests__/`, `src/crawlers/__tests__/`. Some pre-existing tests are still `.js` (`index.test.js`, `worker.test.js`, `node.test.js`, `watchman.test.js`); new tests are `.ts`. This package is covered by `yarn typecheck:tests`.
