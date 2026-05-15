# `jest-mock` — agent notes

Loaded additively on top of root `CLAUDE.md` when working inside this package.

## What lives here

The whole package is one file: `src/index.ts` (~1570 lines). It exports the `ModuleMocker` class plus per-method bindings against a singleton wired to `globalThis`:

```ts
const JestMock = new ModuleMocker(globalThis);
export const fn = JestMock.fn.bind(JestMock);
export const spyOn = JestMock.spyOn.bind(JestMock);
export const mocked = JestMock.mocked.bind(JestMock);
export const replaceProperty = JestMock.replaceProperty.bind(JestMock);
```

`jest-runtime` constructs **its own** `ModuleMocker` per test environment, passing the environment's `global` — see "Symbol from the test env" below.

## Type exports (the ones tests should reach for)

Pick the right helper or you'll silently end up with `any`-flavoured mocks:

| Type | Use for | Source value example |
| --- | --- | --- |
| `Mock<T>` | `jest.fn()` style — function with no real impl | `jest.fn<typeof someFn>()` |
| `MockedFunction<T>` | A function whose **module** is mocked via `jest.mock()` | `import {fn} from './mod'; const f = fn as MockedFunction<typeof fn>` |
| `MockedClass<T>` | A class whose **module** is mocked | `const C = SomeClass as MockedClass<typeof SomeClass>` — exposes `.mockImplementation`, `.prototype.method.mockReturnValue(...)`, etc. |
| `MockedObject<T>` | An object whose methods are mocked | `const o = obj as MockedObject<typeof obj>` |
| `Mocked<T>` | Deep recursive variant of the above — picks `MockedClass`/`MockedFunction`/`MockedObject` based on `T` | what `jest.mocked(x)` returns |
| `MockedShallow<T>` | Like `Mocked<T>` but only one level | `jest.mocked(x, {shallow: true})` |
| `SpiedFunction<T>` / `SpiedClass<T>` / `SpiedGetter<T>` / `SpiedSetter<T>` | Return types of `jest.spyOn(obj, prop)` for each access kind | — |
| `Spied<T>` | Generic variant — picks the right Spied\* | — |
| `Replaced<T>` | Return type of `replaceProperty(...)` — has `replaceValue(v)` and `restore()` | — |

`Mock<T>` extends `MockInstance<T>`. The instance is what carries `.mockReturnValue`/`.mockResolvedValue`/`.mockImplementation`/`.whenCalledWith`/etc.

## API helpers (since they're easy to confuse)

- **`fn(impl?)`** — creates a `Mock<T>`. If `impl` is passed, `T` is inferred from it; otherwise pass the type explicitly as `fn<typeof someFn>()`. Don't use bare `jest.fn()` in typed test code — it widens to `UnknownFunction`.
- **`spyOn(obj, methodName)`** — wraps `obj[methodName]`. Accepts a third arg `'get' | 'set'` to spy on accessors. The returned `SpiedSetter<T>` / `SpiedGetter<T>` differ from `SpiedFunction<T>`.
- **`mocked(source, options?)`** — pure type-cast (`return source as Mocked<T>`). Use to make TS see mock methods on something already mocked by `jest.mock()`. `{shallow: true}` returns `MockedShallow<T>` so nested members keep their original types.
- **`replaceProperty(obj, prop, value)`** — replaces an own property, returns a `Replaced<T>` with `.replaceValue(v)` and `.restore()`. Use for **values** (including getters that return values); use `spyOn` for actual function methods.
- **`whenCalledWith(...args)`** — per-argument-shape branch (#16053). Returns a sub-`Mock` you configure independently. Accepts asymmetric matchers — the dispatcher filters registrations by matching. The branches are listed in `WhenCalledWithRegistration[]` on the mock config; sub-mocks are reset whenever the parent's `mockClear`/`mockReset` runs.
- **`clearMocksOnScope(scope)`** — added in 30.4 (#16088). Walks own properties of `scope` and `mockClear`s any mock it finds. `jest-runtime` calls this on the test-env globals between tests when `clearMocks: true`. **Older test environments don't implement it** — `jest-runtime` falls back gracefully (#16169), so don't assume it exists on `moduleMocker` from outside.

## Hard rules

### `Symbol` from the test environment, not the host

`ModuleMocker`'s constructor takes a `global` argument and uses `global.Symbol` (via `this._environmentGlobal.Symbol`) — specifically `Symbol.dispose` for `using` semantics on mock functions. The fix in #15858 was to stop reaching for the host `Symbol`. When adding any reference to a well-known symbol, route through `this._environmentGlobal.Symbol`, not the bare `Symbol` global.

The reason: `jest-runtime` creates its `ModuleMocker` against the **test environment's** `globalThis` (a fresh VM context), and that context has its own `Symbol` table. A `Symbol.dispose` minted from the host doesn't match the one a `using` declaration in user code would resolve.

### Mock typing in tests — no `as any` ladders

In this codebase's tests, never do:

```ts
// bad
const fake = jest.fn().mockReturnValue(x); // returns Mock<UnknownFunction>
(real as jest.Mock).mockReturnValue(x); // cast soup
```

Use:

```ts
// good
jest.fn<(p: string) => boolean>().mockReturnValue(false);
jest.fn(async () => result);
const MockedClass = RealClass as jest.MockedClass<typeof RealClass>;
MockedClass.prototype.method.mockReturnValue(x);
jest.mocked(realInstance.method).mockReturnValue(x);
```

`__typetests__/mock-functions.test.ts`, `Mocked.test.ts`, and `utility-types.test.ts` are the canonical examples — copy patterns from there.

### `_isMockFunction` and `isMockFunction`

`f._isMockFunction = true` is the duck-type marker that `isMockFunction(x)` checks. `expect`'s spy matchers (`.toHaveBeenCalled`, etc.) use this. Don't expose a `Mock`-shaped value without this marker, and don't strip it when wrapping (e.g. `whenCalledWith` sub-mocks set it on the dispatcher).

### `mockRestore` only restores spies, not `fn()` mocks

`mockReset` clears config + state. `mockClear` clears state only. `mockRestore` is **only meaningful on `spyOn` mocks** — it puts the original implementation back. On `fn()` mocks it's a no-op (other than `mockReset` semantics). Don't promise restoration on freshly-created `fn()` mocks.

### `replaceProperty` vs `spyOn` for properties

Don't `spyOn(obj, 'plainProp')` — `spyOn` requires the value to be a function (or use `'get'`/`'set'` for accessors). The error messages in `_makeComponent` and `spyOn` actively suggest the right API based on what they found: getter → `spyOn(obj, prop, 'get')`, setter → `spyOn(obj, prop, 'set')`, plain → `replaceProperty(obj, prop, value)`.

## Automock

`generateFromMetadata(metadata)` → `_generateMock(metadata, callbacks, refs)` is the automock engine. It walks the metadata produced by `getMetadata(value)` and builds a tree of mocks mirroring the value's shape. Used by `jest-runtime` when `automock: true` or when a module is `jest.mock()`'d with no factory.

`_makeComponent` is the inner factory: it picks `function`/`array`/`regexp`/`object`/etc. paths based on `metadata.type`. The class prototype chain is walked and each method's slots are mocked. Adding a new mock-able shape means adding a `MockMetadataType` value, a metadata extractor branch in `getMetadata`, and a `_generateMock` branch.

## Tests

- `src/__tests__/` — runtime behaviour. Large (`index.test.js`).
- `__typetests__/` — TSTyche assertions. **The canonical reference for typed mock usage.** When adding a new public type, add a typetest.
- This package is in the `test-leak` matrix (`yarn test-leak`) — be careful about retaining references via `WeakMap` keys you never release.
