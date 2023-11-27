# jest-haste-map

`jest-haste-map` is a module used by Jest, a popular JavaScript testing framework, to create a fast lookup of files in a project. It helps Jest efficiently locate and track changes in files during testing, making it particularly useful for large projects with many files.

## why jest-haste-map ?

- **Parallel crawling and analysis:** jest-haste-map crawls the entire project, extracts dependencies, and analyzes files in parallel across worker processes.This can significantly improve the performance of the map building process.
- **Cached file system:** jest-haste-map keeps a cache of the file system in memory and on disk. This allows for fast file related operations, such as resolving module imports and checking for changes.
- **Minimal work**: jest-haste-map only does the minimal amount of work necessary when files change. (If you are using [watchman](https://facebook.github.io/watchman/) (recommended for large projects), Jest will ask watchman for changed files instead of crawling the file system. This is very fast even if you have tens of thousands of files.)
- **File system watching:** jest-haste-map can watch the file system for changes. This is useful for building interactive tools, such as watch mode.

## Installation

with npm :

```bash
npm install jest-haste-map --save-dev
```

with yarn :

```bash
yarn add jest-haste-map --dev
```

## usage

`jest-haste-map` is compatible with both `ES modules` and `CommonJS`

### simple usage

```javascript
const map = new HasteMap.default({
  // options
});
```

### Example usage (get all files with .js extension in the project)

```javascript
import HasteMap from 'jest-haste-map';
import os from 'os';
import {dirname} from 'path';
import {fileURLToPath} from 'url';

const root = dirname(fileURLToPath(import.meta.url));

const map = new HasteMap.default({
  id: 'myproject', //Used for caching.
  extensions: ['js'], // Tells jest-haste-map to only crawl .js files.
  maxWorkers: os.availableParallelism(), //Parallelizes across all available CPUs.
  platforms: [], // This is only used for React Native, you can leave it empty.
  roots: [root], // Can be used to only search a subset of files within `rootDir`
  retainAllFiles: true,
  rootDir: root, //The project root.
});

const {hasteFS} = await map.build();

const files = hasteFS.getAllFiles();

console.log(files);
```

### options

| Option                 | Type                | Required | Default Value |
| ---------------------- | ------------------- | -------- | ------------- |
| cacheDirectory         | string              | No       | `os.tmpdir()` |
| computeDependencies    | boolean             | No       | `true`        |
| computeSha1            | boolean             | No       | `false`       |
| console                | Console             | No       | -             |
| dependencyExtractor    | string \| null      | No       | `null`        |
| enableSymlinks         | boolean             | No       | `false`       |
| extensions             | Array&lt;string&gt; | Yes      | -             |
| forceNodeFilesystemAPI | boolean             | Yes      | -             |
| hasteImplModulePath    | string              | Yes      | -             |
| hasteMapModulePath     | string              | Yes      | -             |
| id                     | string              | Yes      | -             |
| ignorePattern          | HasteRegExp         | No       | -             |
| maxWorkers             | number              | Yes      | -             |
| mocksPattern           | string              | No       | -             |
| platforms              | Array&lt;string&gt; | Yes      | -             |
| resetCache             | boolean             | No       | -             |
| retainAllFiles         | boolean             | Yes      | -             |
| rootDir                | string              | Yes      | -             |
| roots                  | Array&lt;string&gt; | Yes      | -             |
| skipPackageJson        | boolean             | Yes      | -             |
| throwOnModuleCollision | boolean             | Yes      | -             |
| useWatchman            | boolean             | No       | `true`        |

For more, you can check [github](https://github.com/jestjs/jest/tree/main/packages/jest-haste-map)
