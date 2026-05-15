# `jest-config` — agent notes

Loaded additively on top of root `CLAUDE.md` when working inside this package.

## What lives here

`jest-config` loads a user config file, applies presets, validates, normalizes, and produces the `{globalConfig, projectConfig}` pair that the rest of Jest consumes. Public API surface is small; the hard work is in three files.

- `index.ts` (~490 lines) — public API: `readConfig`, `readConfigs`, `defineConfig`, `mergeConfig`, plus the global/project split.
- `normalize.ts` (~1270 lines) — the bulk of the logic. One giant `normalize()` function with a switch over every option, plus preset merging, deprecation routing, and `<rootDir>` resolution.
- `readConfigFileAndSetRootDir.ts` (~250 lines) — multi-format loader (`.js`/`.ts`/`.mts`/`.cts`/`.mjs`/`.cjs`/`.json`).
- `ValidConfig.ts` (~350 lines) — example shape used by `jest-validate`. `initialOptions` (full) and `initialProjectOptions` (project subset).
- `Defaults.ts` — default values applied during normalization.
- `Deprecated.ts` — deprecation message map for `jest-validate`.
- `Descriptions.ts` — human descriptions for `--help` and config schemas.
- `resolveConfigPath.ts` — walks up from `cwd` to find `jest.config.{ext}` / `jest.config.{ext}.json` / `package.json#jest`.
- `setFromArgv.ts` — CLI overrides applied on top of file-loaded options.
- `utils.ts` — `replaceRootDirInPath`, `replaceRootDirTags`, `BULLET`/`DOCUMENTATION_NOTE` constants.

## Adding or changing a config option

Every option lives in multiple places. Touch all of them or validation/help/docs will lie:

1. **Type**: add to `Config.InitialOptions` / `Config.GlobalConfig` / `Config.ProjectConfig` in `packages/jest-types/src/Config.ts`.
2. **Schema**: add to `initialOptions` in `ValidConfig.ts` (and `initialProjectOptions` if project-level). Use `multipleValidOptions(a, b, ...)` to declare alternative valid shapes.
3. **Default**: add to `Defaults.ts`.
4. **Normalization**: add a `case 'optionName':` to the big switch in `normalize.ts` if the value needs transformation (e.g. `<rootDir>` substitution, path resolution). Pure passthrough doesn't need a case.
5. **Global vs project split**: in `index.ts`, copy the value into `globalConfig` (around line 130) or `projectConfig` (around line 200) or both.
6. **Description**: add to `Descriptions.ts` for `--help`.
7. **Deprecating**: add a message function to `Deprecated.ts`. `jest-validate` walks the user's config against this map and emits warnings.
8. **Docs**: add an entry to `docs/Configuration.md`.

Skipping step 5 is the most common mistake: the option lives in the type, validates, and normalizes, but never reaches the runtime.

## Hard rules

### `.mts` is always ESM, full stop

`.mts` cannot be loaded via `require()` or via ts-node. The loader tries native Node TypeScript support first (`process.features.typescript`, Node 22.18+/23.6+); if that fails it throws a hard error pointing at the Node version requirement. Don't add a ts-node fallback for `.mts` — there's no path where that works.

For `.ts` and `.cts`, the loader tries native first, falls back to ts-node (or whatever the `@jest-config-loader` docblock pragma names — `'ts-node'` or `'esbuild-register'`). The pragma also accepts `@jest-config-loader-options` as a JSON string.

### Project-only config can't carry global-only options

Options keyed in `VALID_CONFIG` but not in `VALID_PROJECT_CONFIG` are global-only. Putting one in a `projects: [{...}]` entry emits the "not supported in an individual project configuration" warning (not the generic "probably a typing mistake" warning). That distinction is set up via `unknownProjectOption` and `GLOBAL_ONLY_OPTIONS = VALID_CONFIG \ VALID_PROJECT_CONFIG`.

Recent moves (#16132, #16133): `silent`, `verbose`, `collectCoverage`, `coverageProvider` are now valid at the project level too. When a user reports a "should be project-level" complaint, check whether it's actually global-only or just unimplemented.

### Preset re-evaluation is intentional

`normalize.ts` deletes `require.cache[require.resolve(presetModule)]` before requiring the preset, so multi-project configs see fresh state per project. Don't memoize this without thinking about the `projects` case.

Preset resolution order: if the value is relative/absolute, take it as-is; otherwise look up `<value>/jest-preset` via `Resolver.findNodeModule`. Both `jest-preset.js` and `jest-preset.json` are valid file names.

### `<rootDir>` substitution

`replaceRootDirInPath(rootDir, p)` is the only correct way to substitute. It also normalizes path separators on Windows. Don't `string.replace('<rootDir>', ...)` directly — Windows regex/path interaction will bite.

For glob/regex patterns specifically there's a separate path: `replaceRootDirTags` walks objects and `replacePathSepForRegex` handles the regex side.

## Flow

```
readConfig(argv, packageRoot)
  → resolveConfigPath(...)               find file
  → readConfigFileAndSetRootDir(...)     load + parse (multi-format)
  → setFromArgv(options, argv)           CLI overrides
  → normalize(options, argv, configPath) the big switch
    → preset merging (if `preset` set)
    → recursion per `projects` entry
  → split into {globalConfig, projectConfig}
```

`readConfigs(argv, projectPaths)` runs `readConfig` for each path and aggregates. The "single project vs multi-project" distinction is made at this level; `normalize` doesn't care.

## Public helpers

- `defineConfig(config)` — pure type-helper, returns `config` unchanged. Exists so users get autocompletion without an explicit `as Config.InitialOptions`. Supports object / promise / function / async-function forms via overloads.
- `mergeConfig(defaults, overrides)` — `deepmerge.all([defaults, overrides])`. **Rejects function configs at runtime** (`TypeError: Cannot merge config in form of callback`). Don't try to make it accept functions — the merge has to inspect properties, and a function is opaque until called.

## Tests

- `src/__tests__/*.test.ts` — covered by `typecheck:tests`. Most behaviour is exercised through `normalize.test.ts` (large) and per-feature files.
- `e2e/read-initial-options/` — e2e fixtures for the multi-format loader (one fixture per extension, including `mts-config/`).
- `e2e/__tests__/jest.config.ts.test.ts` and `e2e/__tests__/tsIntegration.test.ts` — TypeScript-config integration; the latter runs through its own `jest.config.ts.mjs` (`yarn test-ts`).
- `e2e/__tests__/configFile.test.ts` — exercises pragma-based loader selection.
