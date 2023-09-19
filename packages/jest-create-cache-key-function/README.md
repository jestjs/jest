# jest-create-cache-key-function

This module creates a function which is used for generating cache keys used by code transformers in Jest.

## Install

```sh
$ npm install --save-dev @jest/create-cache-key-function
```

## API

### `createCacheKey(files?: Array<string>, values?: Array<String>, length?: number): GetCacheKeyFunction`

Returns a function that can be used to generate cache keys based on source code of provided files and provided values.

#### Parameters

- `files`: [Optional] Array of absolute paths to files whose code should be accounted for when generating cache key
- `values`: [Optional] Array of string values that should be accounted for when generating cache key
- `length`: [Optional] Length of the resulting key. The default is `32`, or `16` on Windows.

**Note:**

The source code for your test is already taken into account when generating the cache key. The `files` array should be used to provide files that are not directly related to your code such as external configuration files.

## Usage

Here is some sample usage code while creating a new transformer for Jest

```javascript
const createCacheKeyFunction =
  require('@jest/create-cache-key-function').default;

const filesToAccountFor = [
  __filename,
  require.resolve('some-package-name/package.json'),
];

const valuesToAccountFor = [process.env.SOME_LOCAL_ENV, 'Some_Other_Value'];

module.exports = {
  process(src, filename, config, options) {},
  getCacheKey: createCacheKeyFunction(filesToAccountFor, valuesToAccountFor),
};
```
