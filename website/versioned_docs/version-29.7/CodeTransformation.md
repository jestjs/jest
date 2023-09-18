---
id: code-transformation
title: Code Transformation
---

Jest runs the code in your project as JavaScript, but if you use some syntax not supported by Node out of the box (such as JSX, TypeScript, Vue templates) then you'll need to transform that code into plain JavaScript, similar to what you would do when building for browsers.

Jest supports this via the [`transform`](Configuration.md#transform-objectstring-pathtotransformer--pathtotransformer-object) configuration option.

A transformer is a module that provides a method for transforming source files. For example, if you wanted to be able to use a new language feature in your modules or tests that aren't yet supported by Node, you might plug in a code preprocessor that would transpile a future version of JavaScript to a current one.

Jest will cache the result of a transformation and attempt to invalidate that result based on a number of factors, such as the source of the file being transformed and changing configuration.

## Defaults

Jest ships with one transformer out of the box &ndash; [`babel-jest`](https://github.com/jestjs/jest/tree/main/packages/babel-jest#setup). It will load your project's Babel configuration and transform any file matching the `/\.[jt]sx?$/` RegExp (in other words, any `.js`, `.jsx`, `.ts` or `.tsx` file). In addition, `babel-jest` will inject the Babel plugin necessary for mock hoisting talked about in [ES Module mocking](ManualMocks.md#using-with-es-module-imports).

:::tip

Remember to include the default `babel-jest` transformer explicitly, if you wish to use it alongside with additional code preprocessors:

```json
"transform": {
  "\\.[jt]sx?$": "babel-jest",
  "\\.css$": "some-css-transformer",
}
```

:::

## Writing custom transformers

You can write your own transformer. The API of a transformer is as follows:

```ts
interface TransformOptions<TransformerConfig = unknown> {
  supportsDynamicImport: boolean;
  supportsExportNamespaceFrom: boolean;
  /**
   * The value is:
   * - `false` if Jest runs without Node ESM flag `--experimental-vm-modules`
   * - `true` if the file extension is defined in [extensionsToTreatAsEsm](Configuration.md#extensionstotreatasesm-arraystring)
   * and Jest runs with Node ESM flag `--experimental-vm-modules`
   *
   * See more at https://jestjs.io/docs/next/ecmascript-modules
   */
  supportsStaticESM: boolean;
  supportsTopLevelAwait: boolean;
  instrument: boolean;
  /** Cached file system which is used by `jest-runtime` to improve performance. */
  cacheFS: Map<string, string>;
  /** Jest configuration of currently running project. */
  config: ProjectConfig;
  /** Stringified version of the `config` - useful in cache busting. */
  configString: string;
  /** Transformer configuration passed through `transform` option by the user. */
  transformerConfig: TransformerConfig;
}

type TransformedSource = {
  code: string;
  map?: RawSourceMap | string | null;
};

interface SyncTransformer<TransformerConfig = unknown> {
  canInstrument?: boolean;

  getCacheKey?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<TransformerConfig>,
  ) => string;

  getCacheKeyAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<TransformerConfig>,
  ) => Promise<string>;

  process: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<TransformerConfig>,
  ) => TransformedSource;

  processAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<TransformerConfig>,
  ) => Promise<TransformedSource>;
}

interface AsyncTransformer<TransformerConfig = unknown> {
  canInstrument?: boolean;

  getCacheKey?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<TransformerConfig>,
  ) => string;

  getCacheKeyAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<TransformerConfig>,
  ) => Promise<string>;

  process?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<TransformerConfig>,
  ) => TransformedSource;

  processAsync: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<TransformerConfig>,
  ) => Promise<TransformedSource>;
}

type Transformer<TransformerConfig = unknown> =
  | SyncTransformer<TransformerConfig>
  | AsyncTransformer<TransformerConfig>;

type TransformerCreator<
  X extends Transformer<TransformerConfig>,
  TransformerConfig = unknown,
> = (transformerConfig?: TransformerConfig) => X;

type TransformerFactory<X extends Transformer> = {
  createTransformer: TransformerCreator<X>;
};
```

:::note

The definitions above were trimmed down for brevity. Full code can be found in [Jest repo on GitHub](https://github.com/jestjs/jest/blob/main/packages/jest-transform/src/types.ts) (remember to choose the right tag/commit for your version of Jest).

:::

There are a couple of ways you can import code into Jest - using Common JS (`require`) or ECMAScript Modules (`import` - which exists in static and dynamic versions). Jest passes files through code transformation on demand (for instance when a `require` or `import` is evaluated). This process, also known as "transpilation", might happen _synchronously_ (in the case of `require`), or _asynchronously_ (in the case of `import` or `import()`, the latter of which also works from Common JS modules). For this reason, the interface exposes both pairs of methods for asynchronous and synchronous processes: `process{Async}` and `getCacheKey{Async}`. The latter is called to figure out if we need to call `process{Async}` at all.

Asynchronous transpilation can fall back to the synchronous `process` call if `processAsync` is unimplemented, but synchronous transpilation cannot use the asynchronous `processAsync` call. If your codebase is ESM only, implementing the async variants are sufficient. Otherwise, if any code is loaded through `require` (including `createRequire` from within ESM), then you need to implement the synchronous `process` variant.

Be aware that `node_modules` is not transpiled with default config, the `transformIgnorePatterns` setting must be modified in order to do so.

Semi-related to this are the supports flags we pass (see `CallerTransformOptions` above), but those should be used within the transform to figure out if it should return ESM or CJS, and has no direct bearing on sync vs async

Though not required, we _highly recommend_ implementing `getCacheKey` as well, so we do not waste resources transpiling when we could have read its previous result from disk. You can use [`@jest/create-cache-key-function`](https://www.npmjs.com/package/@jest/create-cache-key-function) to help implement it.

Instead of having your custom transformer implement the `Transformer` interface directly, you can choose to export `createTransformer`, a factory function to dynamically create transformers. This is to allow having a transformer config in your jest config.

:::note

[ECMAScript module](ECMAScriptModules.md) support is indicated by the passed in `supports*` options. Specifically `supportsDynamicImport: true` means the transformer can return `import()` expressions, which is supported by both ESM and CJS. If `supportsStaticESM: true` it means top level `import` statements are supported and the code will be interpreted as ESM and not CJS. See [Node's docs](https://nodejs.org/api/esm.html#esm_differences_between_es_modules_and_commonjs) for details on the differences.

:::

:::tip

Make sure `process{Async}` method returns source map alongside with transformed code, so it is possible to report line information accurately in code coverage and test errors. Inline source maps also work but are slower.

During the development of a transformer it can be useful to run Jest with `--no-cache` to frequently [delete cache](Troubleshooting.md#caching-issues).

:::

### Examples

### TypeScript with type checking

While `babel-jest` by default will transpile TypeScript files, Babel will not verify the types. If you want that you can use [`ts-jest`](https://github.com/kulshekhar/ts-jest).

#### Transforming images to their path

Importing images is a way to include them in your browser bundle, but they are not valid JavaScript. One way of handling it in Jest is to replace the imported value with its filename.

```js title="fileTransformer.js"
const path = require('path');

module.exports = {
  process(sourceText, sourcePath, options) {
    return {
      code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};`,
    };
  },
};
```

```js title="jest.config.js"
module.exports = {
  transform: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/fileTransformer.js',
  },
};
```
