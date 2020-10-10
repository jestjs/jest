---
id: ecmascript-modules
title: ECMAScript Modules
---

Jest ships with _experimental_ support for ECMAScript Modules (ESM).

> Note that due to its experimental nature there are many bugs and missing features in Jest's implementation, both known and unknown. You should check out the [tracking issue](https://github.com/facebook/jest/issues/9430) and the [label](https://github.com/facebook/jest/labels/ES%20Modules) on the issue tracker for the latest status.

> Also note that the APIs Jest uses to implement ESM support is still [considered experimental by Node](https://nodejs.org/api/vm.html#vm_class_vm_module) (as of version `14.13.1`).

With the warnings out of the way, this is how you activate ESM support in your tests.

1. Ensure you either disable [code transforms](./configuration#transform-objectstring-pathtotransformer--pathtotransformer-object) by passing `transform: {}` or otherwise configure your transformer to emit ESM rather than the default CommonJS (CJS).
1. Execute `node` with `--experimental-vm-modules`, e.g. `node --experimental-vm-modules node_modules/.bin/jest` or `NODE_OPTIONS=--experimental-vm-modules npx jest` etc.
1. Beyond that, we attempt to follow `node`'s logic for activating "ESM mode" (such as looking at `type` in `package.json` or `mjs` files), see [their docs](https://nodejs.org/api/esm.html#esm_enabling) for details
