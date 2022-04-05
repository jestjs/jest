---
id: code-transformation
title: Code Transformation
---

Jest runs the code in your project as JavaScript, but if you use some syntax not supported by Node.js out of the box (such as JSX, types from TypeScript, Vue templates etc.) then you'll need to transform that code into plain JavaScript, similar to what you would do when building for browsers.

Jest supports this via the [`transform` configuration option](Configuration.md#transform-objectstring-pathtotransformer--pathtotransformer-object).

A transformer is a module that provides a synchronous function for transforming source files. For example, if you wanted to be able to use a new language feature in your modules or tests that aren't yet supported by Node, you might plug in one of many compilers that compile a future version of JavaScript to a current one.

Jest will cache the result of a transformation and attempt to invalidate that result based on a number of factors, such as the source of the file being transformed and changing configuration.

## Defaults

Jest ships with one transformer out of the box - `babel-jest`. It will automatically load your project's Babel configuration and transform any file matching the following RegEx: `/\.[jt]sx?$/` meaning any `.js`, `.jsx`, `.ts` and `.tsx` file. In addition, `babel-jest` will inject the Babel plugin necessary for mock hoisting talked about in [ES Module mocking](ManualMocks.md#using-with-es-module-imports).

If you override the `transform` configuration option `babel-jest` will no longer be active, and you'll need to add it manually if you wish to use Babel.

## Writing custom transformers

You can write your own transformer. The API of a transformer is as follows:

```ts
// This version of the interface you are seeing on the website has been trimmed down for brevity
// For the full definition, see `packages/jest-transform/src/types.ts` in https://github.com/facebook/jest
// (taking care in choosing the right tag/commit for your version of Jest)

interface TransformOptions<OptionType = unknown> {
  supportsDynamicImport: boolean;
  supportsExportNamespaceFrom: boolean;
  supportsStaticESM: boolean;
  supportsTopLevelAwait: boolean;
  instrument: boolean;
  /** a cached file system which is used in jest-runtime - useful to improve performance */
  cacheFS: Map<string, string>;
  config: Config.ProjectConfig;
  /** A stringified version of the configuration - useful in cache busting */
  configString: string;
  /** the options passed through Jest's config by the user */
  transformerConfig: OptionType;
}

interface SyncTransformer<OptionType = unknown> {
  canInstrument?: boolean;

  getCacheKey?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => string;

  getCacheKeyAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => Promise<string>;

  process: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => TransformedSource;

  processAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => Promise<TransformedSource>;
}

interface AsyncTransformer<OptionType = unknown> {
  canInstrument?: boolean;

  getCacheKey?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => string;

  getCacheKeyAsync?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => Promise<string>;

  process?: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => TransformedSource;

  processAsync: (
    sourceText: string,
    sourcePath: string,
    options: TransformOptions<OptionType>,
  ) => Promise<TransformedSource>;
}

type Transformer<OptionType = unknown> =
  | SyncTransformer<OptionType>
  | AsyncTransformer<OptionType>;

type TransformerCreator<
  X extends Transformer<OptionType>,
  OptionType = unknown,
> = (options?: OptionType) => X;

type TransformerFactory<X extends Transformer> = {
  createTransformer: TransformerCreator<X>;
};
```

There are a couple of ways you can import code into Jest - using Common JS (`require`) or ECMAScript Modules (`import` - which exists in static and dynamic versions). Jest passes files through code transformation on demand (for instance when a `require` or `import` is evaluated). This process, also known as "transpilation", might happen _synchronously_ (in the case of `require`), or _asynchronously_ (in the case of `import` or `import()`, the latter of which also works from Common JS modules). For this reason, the interface exposes both pairs of methods for asynchronous and synchronous processes: `process{Async}` and `getCacheKey{Async}`. The latter is called to figure out if we need to call `process{Async}` at all. Since async transformation can happen synchronously without issue, it's possible for the async case to "fall back" to the sync variant, but not vice versa.

So if your code base is ESM only implementing the async variants is sufficient. Otherwise, if any code is loaded through `require` (including `createRequire` from within ESM), then you need to implement the synchronous variant. Be aware that `node_modules` is not transpiled with default config.

Semi-related to this are the supports flags we pass (see `CallerTransformOptions` above), but those should be used within the transform to figure out if it should return ESM or CJS, and has no direct bearing on sync vs async

Though not required, we _highly recommend_ implementing `getCacheKey` as well, so we do not waste resources transpiling when we could have read its previous result from disk. You can use [`@jest/create-cache-key-function`](https://www.npmjs.com/package/@jest/create-cache-key-function) to help implement it.

Instead of having your custom transformer implement the `Transformer` interface directly, you can choose to export `createTransformer`, a factory function to dynamically create transformers. This is to allow having a transformer config in your jest config.

Note that [ECMAScript module](ECMAScriptModules.md) support is indicated by the passed in `supports*` options. Specifically `supportsDynamicImport: true` means the transformer can return `import()` expressions, which is supported by both ESM and CJS. If `supportsStaticESM: true` it means top level `import` statements are supported and the code will be interpreted as ESM and not CJS. See [Node's docs](https://nodejs.org/api/esm.html#esm_differences_between_es_modules_and_commonjs) for details on the differences.

:::tip

Make sure `TransformedSource` contains a source map, so it is possible to report line information accurately in code coverage and test errors. Inline source maps also work but are slower.

:::

### Examples

### TypeScript with type checking

While `babel-jest` by default will transpile TypeScript files, Babel will not verify the types. If you want that you can use [`ts-jest`](https://github.com/kulshekhar/ts-jest).

#### Transforming images to their path

Importing images is a way to include them in your browser bundle, but they are not valid JavaScript. One way of handling it in Jest is to replace the imported value with its filename.

```js title="fileTransformer.js"
const path = require('path');

module.exports = {
  process(src, filename, config, options) {
    return `module.exports = ${JSON.stringify(path.basename(filename))};`;
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
