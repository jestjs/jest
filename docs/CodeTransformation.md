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

You can write you own transformer. The API of a transformer is as follows:

```ts
interface SyncTransformer<OptionType = unknown> {
  /**
   * Indicates if the transformer is capabale of instrumenting the code for code coverage.
   *
   * If V8 coverage is _not_ active, and this is `true`, Jest will assume the code is instrumented.
   * If V8 coverage is _not_ active, and this is `false`. Jest will instrument the code returned by this transformer using Babel.
   */
  canInstrument?: boolean;
  createTransformer?: (options?: OptionType) => SyncTransformer<OptionType>;

  getCacheKey?: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions<OptionType>,
  ) => string;

  getCacheKeyAsync?: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions<OptionType>,
  ) => Promise<string>;

  process: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions<OptionType>,
  ) => TransformedSource;

  processAsync?: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions<OptionType>,
  ) => Promise<TransformedSource>;
}

interface AsyncTransformer<OptionType = unknown> {
  /**
   * Indicates if the transformer is capabale of instrumenting the code for code coverage.
   *
   * If V8 coverage is _not_ active, and this is `true`, Jest will assume the code is instrumented.
   * If V8 coverage is _not_ active, and this is `false`. Jest will instrument the code returned by this transformer using Babel.
   */
  canInstrument?: boolean;
  createTransformer?: (options?: OptionType) => AsyncTransformer<OptionType>;

  getCacheKey?: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions<OptionType>,
  ) => string;

  getCacheKeyAsync?: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions<OptionType>,
  ) => Promise<string>;

  process?: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions<OptionType>,
  ) => TransformedSource;

  processAsync: (
    sourceText: string,
    sourcePath: Config.Path,
    options: TransformOptions<OptionType>,
  ) => Promise<TransformedSource>;
}

type Transformer<OptionType = unknown> =
  | SyncTransformer<OptionType>
  | AsyncTransformer<OptionType>;

interface TransformOptions<OptionType> {
  /**
   * If a transformer does module resolution and reads files, it should populate `cacheFS` so that
   * Jest avoids reading the same files again, improving performance. `cacheFS` stores entries of
   * <file path, file contents>
   */
  cacheFS: Map<string, string>;
  config: Config.ProjectConfig;
  /** A stringified version of the configuration - useful in cache busting */
  configString: string;
  instrument: boolean;
  // names are copied from babel: https://babeljs.io/docs/en/options#caller
  supportsDynamicImport: boolean;
  supportsExportNamespaceFrom: boolean;
  supportsStaticESM: boolean;
  supportsTopLevelAwait: boolean;
  /** the options passed through Jest's config by the user */
  transformerConfig: OptionType;
}

type TransformedSource =
  | {code: string; map?: RawSourceMap | string | null}
  | string;

// Config.ProjectConfig can be seen in in code [here](https://github.com/facebook/jest/blob/v26.6.3/packages/jest-types/src/Config.ts#L323)
// RawSourceMap comes from [`source-map`](https://github.com/mozilla/source-map/blob/0.6.1/source-map.d.ts#L6-L12)
```

As can be seen, only `process` is mandatory to implement, although we highly recommend implementing `getCacheKey` as well, so we don't waste resources transpiling the same source file when we can read its previous result from disk. You can use [`@jest/create-cache-key-function`](https://www.npmjs.com/package/@jest/create-cache-key-function) to help implement it.

Note that [ECMAScript module](ECMAScriptModules.md) support is indicated by the passed in `supports*` options. Specifically `supportsDynamicImport: true` means the transformer can return `import()` expressions, which is supported by both ESM and CJS. If `supportsStaticESM: true` it means top level `import` statements are supported and the code will be interpreted as ESM and not CJS. See [Node's docs](https://nodejs.org/api/esm.html#esm_differences_between_es_modules_and_commonjs) for details on the differences.

### Examples

### TypeScript with type checking

While `babel-jest` by default will transpile TypeScript files, Babel will not verify the types. If you want that you can use [`ts-jest`](https://github.com/kulshekhar/ts-jest).

#### Transforming images to their path

Importing images is a way to include them in your browser bundle, but they are not valid JavaScript. One way of handling it in Jest is to replace the imported value with its filename.

```js
// fileTransformer.js
const path = require('path');

module.exports = {
  process(src, filename, config, options) {
    return 'module.exports = ' + JSON.stringify(path.basename(filename)) + ';';
  },
};
```

```js
// jest.config.js

module.exports = {
  transform: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/fileTransformer.js',
  },
};
```
