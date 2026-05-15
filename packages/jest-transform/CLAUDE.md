# `@jest/transform` — agent notes

## What's public

- `createScriptTransformer(config, cacheFS?)` — async factory; awaits `loadTransformers()` before returning. Use this, not the `ScriptTransformer` class directly.
- `createTranspilingRequire(config)` — returns a `require`-like function that transforms on demand; used by `jest-config` and `jest-snapshot` for loading `.ts` config/resolver files.
- `shouldInstrument(filename, options, config)` — pure predicate for Istanbul coverage instrumentation.
- Type exports: `Transformer`, `SyncTransformer`, `AsyncTransformer`, `TransformerFactory`, `TransformOptions`, `TransformedSource`, etc.

## Writing a custom transformer

Implement `SyncTransformer` (or `AsyncTransformer` for async-only):

```ts
export const process = (source, path, options): TransformedSource => ({
  code: compile(source), // required
  map: sourceMap, // optional
});

export const getCacheKey = (source, path, options): string =>
  hash(source, options.configString, MY_VERSION); // include anything affecting output
```

For transformers that need config, export a factory instead:

```ts
export const createTransformer = (
  config?: MyConfig,
): SyncTransformer<MyConfig> => ({
  process(source, path, options) {
    /* options.transformerConfig === config */
  },
});
```

`ScriptTransformer` detects `createTransformer` via duck-typing and calls it once per project config entry. `babel-jest` uses this pattern.

## Non-obvious details

**`canInstrument: true`** tells Jest your transformer already injected Istanbul counters. Without it, Jest re-runs the output through `babel-plugin-istanbul`. Set it only if you're actually instrumenting.

**`processAsync` vs `process`**: if a file is `import()`-ed, `processAsync` is preferred when available. If only `processAsync` is exported (`AsyncTransformer`), `require()` will throw.

**Cache key stability**: `getCacheKey` must be deterministic — no timestamps, no random values. The fallback key (no `getCacheKey`) is a SHA1 of source content + config. Bump `CACHE_VERSION` in `ScriptTransformer.ts` when changing output format in a way `getCacheKey` can't capture.

**`CallerTransformOptions`** in `TransformOptions`: `supportsDynamicImport`, `supportsStaticESM`, `supportsTopLevelAwait` signal what the caller handles. `babel-jest` sets all three to `false`, forcing CommonJS output. Check `supportsStaticESM` before emitting ESM.
