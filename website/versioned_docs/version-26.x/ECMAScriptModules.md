---
id: ecmascript-modules
title: ECMAScript Modules
---

:::caution

Jest ships with **experimental** support for ECMAScript Modules (ESM).

The implementation may have bugs and lack features. For the latest status check out the [issue](https://github.com/facebook/jest/issues/9430) and the [label](https://github.com/facebook/jest/labels/ES%20Modules) on the issue tracker.

Also note that the APIs Jest uses to implement ESM support are still [considered experimental by Node](https://nodejs.org/api/vm.html#vm_class_vm_module) (as of version `18.8.0`).

:::

With the warnings out of the way, this is how you activate ESM support in your tests.

1. Ensure you either disable [code transforms](Configuration.md#transform-objectstring-pathtotransformer--pathtotransformer-object) by passing `transform: {}` or otherwise configure your transformer to emit ESM rather than the default CommonJS (CJS).
1. Execute `node` with `--experimental-vm-modules`, e.g. `node --experimental-vm-modules node_modules/jest/bin/jest.js` or `NODE_OPTIONS=--experimental-vm-modules npx jest` etc..

   On Windows, you can use [`cross-env`](https://github.com/kentcdodds/cross-env) to be able to set environment variables.

   If you use Yarn, you can use `yarn node --experimental-vm-modules $(yarn bin jest)`. This command will also work if you use [Yarn Plug'n'Play](https://yarnpkg.com/features/pnp).

1. Beyond that, we attempt to follow `node`'s logic for activating "ESM mode" (such as looking at `type` in `package.json` or `mjs` files), see [their docs](https://nodejs.org/api/esm.html#esm_enabling) for details

## Differences between ESM and CommonJS

Most of the differences are explained in [Node's documentation](https://nodejs.org/api/esm.html#esm_differences_between_es_modules_and_commonjs), but in addition to the things mentioned there, Jest injects a special variable into all executed files - the [`jest` object](JestObjectAPI.md). To access this object in ESM, you need to import it from the `@jest/globals` module.

```js
import {jest} from '@jest/globals';

jest.useFakeTimers();

// etc.
```

Additionally, since ESM evaluates static `import` statements before looking at the code, the hoisting of `jest.mock` calls that happens in CJS won't work in ESM. To mock modules in ESM, you need to use `require` or dynamic `import()` after `jest.mock` calls to load the mocked modules - the same applies to modules which load the mocked modules.

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

Please note that we currently don't support `jest.mock` in a clean way in ESM, but that is something we intend to add proper support for in the future. Follow [this issue](https://github.com/facebook/jest/issues/10025) for updates.
