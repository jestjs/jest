---
id: getting-started
title: Getting Started
---

Install Jest using your favorite package manager:

```bash npm2yarn
npm install --save-dev jest
```

Let's get started by writing a test for a hypothetical function that adds two numbers. First, create a `sum.js` file:

```javascript
function sum(a, b) {
  return a + b;
}
module.exports = sum;
```

Then, create a file named `sum.test.js`. This will contain our actual test:

```javascript
const sum = require('./sum');

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
```

Add the following section to your `package.json`:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

Finally, run `yarn test` or `npm test` and Jest will print this message:

```bash
PASS  ./sum.test.js
✓ adds 1 + 2 to equal 3 (5ms)
```

**You just successfully wrote your first test using Jest!**

This test used `expect` and `toBe` to test that two values were exactly identical. To learn about the other things that Jest can test, see [Using Matchers](UsingMatchers.md).

## Running from command line

You can run Jest directly from the CLI (if it's globally available in your `PATH`, e.g. by `yarn global add jest` or `npm install jest --global`) with a variety of useful options.

Here's how to run Jest on files matching `my-test`, using `config.json` as a configuration file and display a native OS notification after the run:

```bash
jest my-test --notify --config=config.json
```

If you'd like to learn more about running `jest` through the command line, take a look at the [Jest CLI Options](CLI.md) page.

## Additional Configuration

### Generate a basic configuration file

Based on your project, Jest will ask you a few questions and will create a basic configuration file with a short description for each option:

```bash
jest --init
```

### Using Babel

To use [Babel](https://babeljs.io/), install required dependencies:

```bash npm2yarn
npm install --save-dev babel-jest @babel/core @babel/preset-env
```

Configure Babel to target your current version of Node by creating a `babel.config.js` file in the root of your project:

```javascript title="babel.config.js"
module.exports = {
  presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
};
```

The ideal configuration for Babel will depend on your project. See [Babel's docs](https://babeljs.io/docs/en/) for more details.

<details>
  <summary markdown="span"><strong>Making your Babel config jest-aware</strong></summary>

Jest will set `process.env.NODE_ENV` to `'test'` if it's not set to something else. You can use that in your configuration to conditionally setup only the compilation needed for Jest, e.g.

```javascript title="babel.config.js"
module.exports = api => {
  const isTest = api.env('test');
  // You can use isTest to determine what presets and plugins to use.

  return {
    // ...
  };
};
```

:::note

`babel-jest` is automatically installed when installing Jest and will automatically transform files if a babel configuration exists in your project. To avoid this behavior, you can explicitly reset the `transform` configuration option:

```javascript title="jest.config.js"
module.exports = {
  transform: {},
};
```

:::

</details>

### Using webpack

Jest can be used in projects that use [webpack](https://webpack.js.org/) to manage assets, styles, and compilation. webpack does offer some unique challenges over other tools. Refer to the [webpack guide](Webpack.md) to get started.

### Using Vite

Jest can be used in projects that use [vite](https://vitejs.dev/) to serve source code over native ESM to provide some frontend tooling, vite is an opinionated tool and does offer some out-of-the box workflows. Jest is not fully supported by vite due to how the [plugin system](https://github.com/vitejs/vite/issues/1955#issuecomment-776009094) from vite works, but there are some working examples for first-class jest integration using `vite-jest`, since this is not fully supported, you might as well read the [limitation of the `vite-jest`](https://github.com/sodatea/vite-jest/tree/main/packages/vite-jest#limitations-and-differences-with-commonjs-tests). Refer to the [vite guide](https://vitejs.dev/guide/) to get started.

### Using Parcel

Jest can be used in projects that use [parcel-bundler](https://parceljs.org/) to manage assets, styles, and compilation similar to webpack. Parcel requires zero configuration. Refer to the official [docs](https://parceljs.org/docs/) to get started.

### Using TypeScript

#### Via `babel`

Jest supports TypeScript, via Babel. First, make sure you followed the instructions on [using Babel](#using-babel) above. Next, install the `@babel/preset-typescript`:

```bash npm2yarn
npm install --save-dev @babel/preset-typescript
```

Then add `@babel/preset-typescript` to the list of presets in your `babel.config.js`.

```javascript title="babel.config.js"
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    // highlight-next-line
    '@babel/preset-typescript',
  ],
};
```

However, there are some [caveats](https://babeljs.io/docs/en/babel-plugin-transform-typescript#caveats) to using TypeScript with Babel. Because TypeScript support in Babel is purely transpilation, Jest will not type-check your tests as they are run. If you want that, you can use [ts-jest](https://github.com/kulshekhar/ts-jest) instead, or just run the TypeScript compiler [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html) separately (or as part of your build process).

#### Via `ts-jest`

[ts-jest](https://github.com/kulshekhar/ts-jest) is a TypeScript preprocessor with source map support for Jest that lets you use Jest to test projects written in TypeScript.

```bash npm2yarn
npm install --save-dev ts-jest
```

In order for Jest to transpile TypeScript with `ts-jest`, you may also need to create a [configuration](https://kulshekhar.github.io/ts-jest/docs/getting-started/installation#jest-config-file) file.

#### Type definitions

There are two ways to have [Jest global APIs](GlobalAPI.md) typed for test files written in TypeScript.

You can use type definitions which ships with Jest and will update each time you update Jest. Install the `@jest/globals` package:

```bash npm2yarn
npm install --save-dev @jest/globals
```

And import the APIs from it:

```ts title="sum.test.ts"
import {describe, expect, test} from '@jest/globals';
import {sum} from './sum';

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
```

:::tip

See the additional usage documentation of [`describe.each`/`test.each`](GlobalAPI.md#typescript-usage) and [`mock functions`](MockFunctionAPI.md#typescript-usage).

:::

Or you may choose to install the [`@types/jest`](https://npmjs.com/package/@types/jest) package. It provides types for Jest globals without a need to import them.

```bash npm2yarn
npm install --save-dev @types/jest
```

:::info

`@types/jest` is a third party library maintained at [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jest), hence the latest Jest features or versions may not be covered yet. Try to match versions of Jest and `@types/jest` as closely as possible. For example, if you are using Jest `27.4.0` then installing `27.4.x` of `@types/jest` is ideal.

:::
