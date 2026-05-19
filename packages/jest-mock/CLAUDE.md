# `jest-mock` — agent notes

## What lives here

The whole package is one file: `src/index.ts`. The `ModuleMocker` class plus singleton bindings:

```ts
const JestMock = new ModuleMocker(globalThis);
export const fn = JestMock.fn.bind(JestMock);
// + spyOn, mocked, replaceProperty
```

`jest-runtime` constructs its **own** `ModuleMocker` per test environment, passing the environment's `global` — see "Symbol from the test env" below.

## API gotchas

(For the type-exports cheat sheet — `MockedClass<T>` vs `MockedFunction<T>` vs `MockedObject<T>` etc. — see the root `copilot-instructions.md`. The patterns below are jest-mock-specific.)

- **`spyOn(obj, prop)`** requires `obj[prop]` to be a function. For accessors, pass a third arg: `'get'` or `'set'` — returns `SpiedGetter<T>` / `SpiedSetter<T>` respectively. For plain values, use `replaceProperty`. The error messages in `_makeComponent` and `spyOn` actively suggest the right API based on what they found.
- **`mocked(source, options?)`** is a pure type-cast (`return source as Mocked<T>`). It does no runtime work. `{shallow: true}` returns `MockedShallow<T>` so nested members keep their original types.
- **`replaceProperty(obj, prop, value)`** returns a `Replaced<T>` with `.replaceValue(v)` and `.restore()`. Use for value/getter properties; use `spyOn` for function methods.
- **`whenCalledWith(...args)`** (#16053) registers a per-argument-shape branch. Returns a sub-`Mock` configured independently; accepts asymmetric matchers. Sub-mocks are reset whenever the parent's `mockClear`/`mockReset` runs (`_resetWhenCalledWithSubMocks`).
- **`clearMocksOnScope(scope)`** (#16088) walks own properties of `scope` and `mockClear`s any mock it finds. **Older test environments don't implement it** — `jest-runtime` falls back gracefully (#16169), so don't assume it exists on `moduleMocker` from outside this package.

## Hard rules

### `Symbol` from the test environment, not the host

`ModuleMocker`'s constructor takes a `global` argument and uses `global.Symbol` (via `this._environmentGlobal.Symbol`) — specifically `Symbol.dispose` for `using` semantics on mock functions. `jest-runtime` constructs the mocker against the **test environment's** `globalThis` (a fresh VM context with its own `Symbol` table). A `Symbol.dispose` minted from the host wouldn't match the one a `using` declaration in user code resolves. The fix in #15858 was to stop reaching for the host `Symbol`. **When adding any reference to a well-known symbol, route through `this._environmentGlobal.Symbol`.**

### `_isMockFunction` is the duck-type marker

`f._isMockFunction = true` is what `isMockFunction(x)` checks; `expect`'s spy matchers (`.toHaveBeenCalled`, etc.) use this. Don't expose a `Mock`-shaped value without this marker, and don't strip it when wrapping (e.g. `whenCalledWith` sub-mocks set it on the dispatcher).

## Automock

`generateFromMetadata(metadata)` → `_generateMock(metadata, callbacks, refs)` is the automock engine. It walks the metadata produced by `getMetadata(value)` and builds a tree of mocks mirroring the value's shape. Used by `jest-runtime` when `automock: true` or when a module is `jest.mock()`'d with no factory.

`_makeComponent` is the inner factory: it picks `function`/`array`/`regexp`/`object`/etc. paths based on `metadata.type`. The class prototype chain is walked and each method's slots are mocked. Adding a new mock-able shape means adding a `MockMetadataType` value, a metadata extractor branch in `getMetadata`, and a `_generateMock` branch.

## Tests

`__typetests__/` (especially `mock-functions.test.ts`, `Mocked.test.ts`, `utility-types.test.ts`) is the **canonical reference for typed mock usage**. When adding a new public type, add a typetest.

Mind `WeakMap`-key retention — the test-leak detector (root §Testing) will catch leaks here, and `ModuleMocker` holds mock state on several `WeakMap`s.
