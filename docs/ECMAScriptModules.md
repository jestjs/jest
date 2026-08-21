---
id: ecmascript-modules
title: ECMAScript Modules
---

:::caution

Jest ships with **experimental** support for ECMAScript Modules (ESM).

The implementation may have bugs and lack features. For the latest status check out the [issue](https://github.com/jestjs/jest/issues/9430) and the [label](https://github.com/jestjs/jest/labels/ES%20Modules) on the issue tracker.

Also note that the APIs Jest uses to implement ESM support are still [considered experimental by Node](https://nodejs.org/api/vm.html#vm_class_vm_module) (as of version `18.8.0`).

:::

With the warnings out of the way, this is how you activate ESM support in your tests.

1. Ensure you either disable [code transforms](Configuration.md#transform-objectstring-pathtotransformer--pathtotransformer-object) by passing `transform: {}` or otherwise configure your transformer to emit ESM rather than the default CommonJS (CJS).
1. Execute `node` with `--experimental-vm-modules`, e.g. `node --experimental-vm-modules node_modules/jest/bin/jest.js` or `NODE_OPTIONS="$NODE_OPTIONS --experimental-vm-modules" npx jest` etc.

   On Windows, you can use [`cross-env`](https://github.com/kentcdodds/cross-env) to be able to set environment variables.

   If you use Yarn, you can use `yarn node --experimental-vm-modules $(yarn bin jest)`. This command will also work if you use [Yarn Plug'n'Play](https://yarnpkg.com/features/pnp).

   If your codebase includes ESM imports from `*.wasm` files, you do _not_ need to pass `--experimental-wasm-modules` to `node`. Current implementation of WebAssembly imports in Jest relies on experimental VM modules, however, this may change in the future.

1. Beyond that, we attempt to follow `node`'s logic for activating "ESM mode" (such as looking at `type` in `package.json` or `.mjs` files), see [their docs](https://nodejs.org/api/esm.html#esm_enabling) for details.
1. If you want to treat other file extensions (such as `.jsx` or `.ts`) as ESM, please use the [`extensionsToTreatAsEsm` option](Configuration.md#extensionstotreatasesm-arraystring).

## Differences between ESM and CommonJS

Most of the differences are explained in [Node's documentation](https://nodejs.org/api/esm.html#esm_differences_between_es_modules_and_commonjs), but in addition to the things mentioned there, Jest injects a special variable into all executed files - the [`jest` object](JestObjectAPI.md). To access this object in ESM, you need to import it from the `@jest/globals` module or use `import.meta`.

```js
import {jest} from '@jest/globals';

jest.useFakeTimers();

// etc.

// alternatively
import.meta.jest.useFakeTimers();

// jest === import.meta.jest => true
```

## `require()` of ESM

On Node v24.9 and later, Jest supports `require()`-ing an ES module from CJS code, mirroring [Node's own `require(esm)`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).

```js title="main.test.cjs"
const {value, default: defaultExport} = require('./esm-module.mjs');
```

Calling `require()` on an ESM file with top-level `await` (or whose graph contains TLA) throws `ERR_REQUIRE_ASYNC_MODULE`. Use `await import(...)` for those files.

Packages resolve through the [`require` and `module-sync` conditions](https://nodejs.org/api/packages.html#community-conditions-definitions), as they do in Node. A package that exposes its ESM entry point under `module-sync` can therefore be `require()`d, and one that exposes it only under `import` cannot - Node refuses that too, with `ERR_PACKAGE_PATH_NOT_EXPORTED`. A `module-sync` entry point whose graph contains top-level `await` throws `ERR_REQUIRE_ASYNC_MODULE`.

`jest.mock` does _not_ apply when the resolved file is ESM - `jest.mock` is for CJS targets. To mock an ESM file you `require()`, register the mock via `jest.unstable_mockModule` (the mock applies to transitive dependencies the loaded ESM imports).

On Node versions older than v24.9, `require()` of an ESM file still throws `ERR_REQUIRE_ESM`.

## Divergences from Node

Jest's module system diverges from Node's in a few places:

- In a graph that mixes ESM and CJS, the CJS dependencies execute while the graph is built, so a CJS module can run earlier relative to its ESM siblings than it would in Node.
- The named exports of a CJS module imported from ESM are a superset of Node's: keys present on `module.exports` after evaluation are exposed in addition to what static analysis finds.
- Writes to and deletes from `require.cache` are silently ignored.
- The static members of `require('module')` (such as `Module._resolveFilename`) come from the host Node, not from Jest's module system.
- `require()` of an ES module that is part of a graph currently being loaded throws `ERR_REQUIRE_CYCLE_MODULE` even when the required module is not an ancestor of the requiring module.
- The `'module.exports'` named export of an imported CJS module is exposed on every Node version, including versions older than v23 where Node itself does not provide it.
- Importing JSON without `with {type: 'json'}` emits a warning instead of throwing. This becomes an error in a future major version.
- An `application/wasm` data: URI requires the `;base64` parameter and reports a descriptive error without it, where Node hands the percent-decoded text to WebAssembly and fails with `CompileError`.
- A bare core specifier with a query or fragment (`import 'fs?q'`) throws `ERR_UNKNOWN_BUILTIN_MODULE`, where Node treats the whole string as a package name and fails with `ERR_MODULE_NOT_FOUND`. The `node:`-prefixed form throws the same error in both.
- Stack traces show file paths, not `file://` URLs.

## Module mocking in ESM

Since ESM evaluates static `import` statements before looking at the code, the hoisting of `jest.mock` calls that happens in CJS won't work for ESM. To mock modules in ESM, you need to use `require` or dynamic `import()` after `jest.mock` calls to load the mocked modules - the same applies to modules which load the mocked modules.

ESM mocking is supported through `jest.unstable_mockModule`. As the name suggests, this API is still work in progress, please follow [this issue](https://github.com/jestjs/jest/issues/10025) for updates.

The usage of `jest.unstable_mockModule` is essentially the same as `jest.mock` with two differences: the factory function is required and it can be sync or async:

```js
import {jest} from '@jest/globals';

jest.unstable_mockModule('node:child_process', () => ({
  execSync: jest.fn(),
  // etc.
}));

const {execSync} = await import('node:child_process');

// etc.
```

## Module unmocking in ESM

```js title="esm-module.mjs"
export default () => {
  return 'default';
};

export const namedFn = () => {
  return 'namedFn';
};
```

```js title="esm-module.test.mjs"
import {jest, test} from '@jest/globals';

test('test esm-module', async () => {
  jest.unstable_mockModule('./esm-module.js', () => ({
    default: () => 'default implementation',
    namedFn: () => 'namedFn implementation',
  }));

  const mockModule = await import('./esm-module.js');

  console.log(mockModule.default()); // 'default implementation'
  console.log(mockModule.namedFn()); // 'namedFn implementation'

  jest.unstable_unmockModule('./esm-module.js');

  const originalModule = await import('./esm-module.js');

  console.log(originalModule.default()); // 'default'
  console.log(originalModule.namedFn()); // 'namedFn'

  /* !!! WARNING !!! Don`t override */
  jest.unstable_mockModule('./esm-module.js', () => ({
    default: () => 'default override implementation',
    namedFn: () => 'namedFn override implementation',
  }));

  const mockModuleOverride = await import('./esm-module.js');

  console.log(mockModuleOverride.default()); // 'default implementation'
  console.log(mockModuleOverride.namedFn()); // 'namedFn implementation'
});
```

## Mocking CJS modules

For mocking CJS modules, you should continue to use `jest.mock`. See the example below:

```js title="main.cjs"
const {BrowserWindow, app} = require('electron');

// etc.

module.exports = {example};
```

```js title="main.test.cjs"
import {createRequire} from 'node:module';
import {jest} from '@jest/globals';

const require = createRequire(import.meta.url);

jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    // partial mocks.
  })),
}));

const {BrowserWindow} = require('electron');
const exported = require('./main.cjs');

// alternatively
const {BrowserWindow} = (await import('electron')).default;
const exported = await import('./main.cjs');

// etc.
```
