---
id: configuration
title: Configuring Jest
---

The Jest philosophy is to work great by default, but sometimes you just need more configuration power.

It is recommended to define the configuration in a dedicated JavaScript, TypeScript or JSON file. The file will be discovered automatically, if it is named `jest.config.js|ts|mjs|cjs|json`. You can use [`--config`](CLI.md#--configpath) flag to pass an explicit path to the file.

:::note

Keep in mind that the resulting configuration object must always be JSON-serializable.

:::

The configuration file should simply export an object:

```js tab
/** @type {import('jest').Config} */
const config = {
  verbose: true,
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  verbose: true,
};

export default config;
```

Or a function returning an object:

```js tab
/** @returns {Promise<import('jest').Config>} */
module.exports = async () => {
  return {
    verbose: true,
  };
};
```

```ts tab
import type {Config} from 'jest';

export default async (): Promise<Config> => {
  return {
    verbose: true,
  };
};
```

:::tip

To read TypeScript configuration files Jest requires [`ts-node`](https://npmjs.com/package/ts-node). Make sure it is installed in your project.

:::

The configuration also can be stored in a JSON file as a plain object:

```json title="jest.config.json"
{
  "bail": 1,
  "verbose": true
}
```

Alternatively Jest's configuration can be defined through the `"jest"` key in the `package.json` of your project:

```json title="package.json"
{
  "name": "my-project",
  "jest": {
    "verbose": true
  }
}
```

## Options

:::info

You can retrieve Jest's defaults from `jest-config` to extend them if needed:

```js tab
const {defaults} = require('jest-config');

/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mts', 'cts'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';
import {defaults} from 'jest-config';

const config: Config = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mts'],
};

export default config;
```

:::

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(2)} />

---

## Reference

### `automock` \[boolean]

Default: `false`

This option tells Jest that all imported modules in your tests should be mocked automatically. All modules used in your tests will have a replacement implementation, keeping the API surface.

Example:

```js title="utils.js"
export default {
  authorize: () => 'token',
  isAuthorized: secret => secret === 'wizard',
};
```

```js title="__tests__/automock.test.js"
import utils from '../utils';

test('if utils mocked automatically', () => {
  // Public methods of `utils` are now mock functions
  expect(utils.authorize.mock).toBeTruthy();
  expect(utils.isAuthorized.mock).toBeTruthy();

  // You can provide them with your own implementation
  // or pass the expected return value
  utils.authorize.mockReturnValue('mocked_token');
  utils.isAuthorized.mockReturnValue(true);

  expect(utils.authorize()).toBe('mocked_token');
  expect(utils.isAuthorized('not_wizard')).toBeTruthy();
});
```

:::note

Node modules are automatically mocked when you have a manual mock in place (e.g.: `__mocks__/lodash.js`). More info [here](ManualMocks.md#mocking-node-modules).

Node.js core modules, like `fs`, are not mocked by default. They can be mocked explicitly, like `jest.mock('fs')`.

:::

### `bail` \[number | boolean]

Default: `0`

By default, Jest runs all tests and produces all errors into the console upon completion. The bail config option can be used here to have Jest stop running tests after `n` failures. Setting bail to `true` is the same as setting bail to `1`.

### `cacheDirectory` \[string]

Default: `"/tmp/<path>"`

The directory where Jest should store its cached dependency information.

Jest attempts to scan your dependency tree once (up-front) and cache it in order to ease some of the filesystem churn that needs to happen while running tests. This config option lets you customize where Jest stores that cache data on disk.

### `clearMocks` \[boolean]

Default: `false`

Automatically clear mock calls, instances, contexts and results before every test. Equivalent to calling [`jest.clearAllMocks()`](JestObjectAPI.md#jestclearallmocks) before each test. This does not remove any mock implementation that may have been provided.

### `collectCoverage` \[boolean]

Default: `false`

Indicates whether the coverage information should be collected while executing the test. Because this retrofits all executed files with coverage collection statements, it may significantly slow down your tests.

Jest ships with two coverage providers: `babel` (default) and `v8`. See the [`coverageProvider`](#coverageprovider-string) option for more details.

:::info

The `babel` and `v8` coverage providers use `/* istanbul ignore next */` and `/* c8 ignore next */` comments to exclude lines from coverage reports, respectively. For more information, you can view the [`istanbuljs` documentation](https://github.com/istanbuljs/nyc#parsing-hints-ignoring-lines) and the [`c8` documentation](https://github.com/bcoe/c8#ignoring-uncovered-lines-functions-and-blocks).

:::

### `collectCoverageFrom` \[array]

Default: `undefined`

An array of [glob patterns](https://github.com/micromatch/micromatch) indicating a set of files for which coverage information should be collected. If a file matches the specified glob pattern, coverage information will be collected for it even if no tests exist for this file and it's never required in the test suite.

```js tab
/** @type {import('jest').Config} */
const config = {
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};

export default config;
```

This will collect coverage information for all the files inside the project's `rootDir`, except the ones that match `**/node_modules/**` or `**/vendor/**`.

:::tip

Each glob pattern is applied in the order they are specified in the config. For example `["!**/__tests__/**", "**/*.js"]` will not exclude `__tests__` because the negation is overwritten with the second pattern. In order to make the negated glob work in this example it has to come after `**/*.js`.

:::

:::note

This option requires `collectCoverage` to be set to `true` or Jest to be invoked with `--coverage`.

:::

<details>
  <summary>Help:</summary>

If you are seeing coverage output such as...

```
=============================== Coverage summary ===============================
Statements   : Unknown% ( 0/0 )
Branches     : Unknown% ( 0/0 )
Functions    : Unknown% ( 0/0 )
Lines        : Unknown% ( 0/0 )
================================================================================
Jest: Coverage data for global was not found.
```

Most likely your glob patterns are not matching any files. Refer to the [micromatch](https://github.com/micromatch/micromatch) documentation to ensure your globs are compatible.

</details>

### `coverageDirectory` \[string]

Default: `undefined`

The directory where Jest should output its coverage files.

### `coveragePathIgnorePatterns` \[array&lt;string&gt;]

Default: `["/node_modules/"]`

An array of regexp pattern strings that are matched against all file paths before executing the test. If the file path matches any of the patterns, coverage information will be skipped.

These pattern strings match against the full path. Use the `<rootDir>` string token to include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories. Example: `["<rootDir>/build/", "<rootDir>/node_modules/"]`.

### `coverageProvider` \[string]

Indicates which provider should be used to instrument code for coverage. Allowed values are `babel` (default) or `v8`.

### `coverageReporters` \[array&lt;string | \[string, options]&gt;]

Default: `["clover", "json", "lcov", "text"]`

A list of reporter names that Jest uses when writing coverage reports. Any [istanbul reporter](https://github.com/istanbuljs/istanbuljs/tree/master/packages/istanbul-reports/lib) can be used.

:::tip

Setting this option overwrites the default values. Add `"text"` or `"text-summary"` to see a coverage summary in the console output.

:::

Additional options can be passed using the tuple form. For example, you may hide coverage report lines for all fully-covered files:

```js tab
/** @type {import('jest').Config} */
const config = {
  coverageReporters: ['clover', 'json', 'lcov', ['text', {skipFull: true}]],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  coverageReporters: ['clover', 'json', 'lcov', ['text', {skipFull: true}]],
};

export default config;
```

For more information about the options object shape refer to `CoverageReporterWithOptions` type in the [type definitions](https://github.com/jestjs/jest/tree/main/packages/jest-types/src/Config.ts).

### `coverageThreshold` \[object]

Default: `undefined`

This will be used to configure minimum threshold enforcement for coverage results. Thresholds can be specified as `global`, as a [glob](https://github.com/isaacs/node-glob#glob-primer), and as a directory or file path. If thresholds aren't met, jest will fail. Thresholds specified as a positive number are taken to be the minimum percentage required. Thresholds specified as a negative number represent the maximum number of uncovered entities allowed.

For example, with the following configuration jest will fail if there is less than 80% branch, line, and function coverage, or if there are more than 10 uncovered statements:

```js tab
/** @type {import('jest').Config} */
const config = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },
};

export default config;
```

If globs or paths are specified alongside `global`, coverage data for matching paths will be subtracted from overall coverage and thresholds will be applied independently. Thresholds for globs are applied to all files matching the glob. If the file specified by path is not found, an error is returned.

For example, with the following configuration:

```js tab
/** @type {import('jest').Config} */
const config = {
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    './src/components/': {
      branches: 40,
      statements: 40,
    },
    './src/reducers/**/*.js': {
      statements: 90,
    },
    './src/api/very-important-module.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    './src/components/': {
      branches: 40,
      statements: 40,
    },
    './src/reducers/**/*.js': {
      statements: 90,
    },
    './src/api/very-important-module.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default config;
```

Jest will fail if:

- The `./src/components` directory has less than 40% branch or statement coverage.
- One of the files matching the `./src/reducers/**/*.js` glob has less than 90% statement coverage.
- The `./src/api/very-important-module.js` file has less than 100% coverage.
- Every remaining file combined has less than 50% coverage (`global`).

### `dependencyExtractor` \[string]

Default: `undefined`

This option allows the use of a custom dependency extractor. It must be a node module that exports an object with an `extract` function. E.g.:

```javascript
const crypto = require('crypto');
const fs = require('fs');

module.exports = {
  extract(code, filePath, defaultExtract) {
    const deps = defaultExtract(code, filePath);
    // Scan the file and add dependencies in `deps` (which is a `Set`)
    return deps;
  },
  getCacheKey() {
    return crypto
      .createHash('md5')
      .update(fs.readFileSync(__filename))
      .digest('hex');
  },
};
```

The `extract` function should return an iterable (`Array`, `Set`, etc.) with the dependencies found in the code.

That module can also contain a `getCacheKey` function to generate a cache key to determine if the logic has changed and any cached artifacts relying on it should be discarded.

### `displayName` \[string, object]

default: `undefined`

Allows for a label to be printed alongside a test while it is running. This becomes more useful in multi-project repositories where there can be many jest configuration files. This visually tells which project a test belongs to.

```js tab
/** @type {import('jest').Config} */
const config = {
  displayName: 'CLIENT',
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  displayName: 'CLIENT',
};

export default config;
```

Alternatively, an object with the properties `name` and `color` can be passed. This allows for a custom configuration of the background color of the displayName. `displayName` defaults to white when its value is a string. Jest uses [`chalk`](https://github.com/chalk/chalk) to provide the color. As such, all of the valid options for colors supported by `chalk` are also supported by Jest.

```js tab
/** @type {import('jest').Config} */
const config = {
  displayName: {
    name: 'CLIENT',
    color: 'blue',
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  displayName: {
    name: 'CLIENT',
    color: 'blue',
  },
};

export default config;
```

### `errorOnDeprecated` \[boolean]

Default: `false`

Make calling deprecated APIs throw helpful error messages. Useful for easing the upgrade process.

### `extensionsToTreatAsEsm` \[array&lt;string&gt;]

Default: `[]`

Jest will run `.mjs` and `.js` files with nearest `package.json`'s `type` field set to `module` as ECMAScript Modules. If you have any other files that should run with native ESM, you need to specify their file extension here.

```js tab
/** @type {import('jest').Config} */
const config = {
  extensionsToTreatAsEsm: ['.ts'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  extensionsToTreatAsEsm: ['.ts'],
};

export default config;
```

:::caution

Jest's ESM support is still experimental, see [its docs for more details](ECMAScriptModules.md).

:::

### `fakeTimers` \[object]

Default: `{}`

The fake timers may be useful when a piece of code sets a long timeout that we don't want to wait for in a test. For additional details see [Fake Timers guide](TimerMocks.md) and [API documentation](JestObjectAPI.md#fake-timers).

This option provides the default configuration of fake timers for all tests. Calling `jest.useFakeTimers()` in a test file will use these options or will override them if a configuration object is passed. For example, you can tell Jest to keep the original implementation of `process.nextTick()` and adjust the limit of recursive timers that will be run:

```js tab
/** @type {import('jest').Config} */
const config = {
  fakeTimers: {
    doNotFake: ['nextTick'],
    timerLimit: 1000,
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  fakeTimers: {
    doNotFake: ['nextTick'],
    timerLimit: 1000,
  },
};

export default config;
```

```js title="fakeTime.test.js"
// install fake timers for this file using the options from Jest configuration
jest.useFakeTimers();

test('increase the limit of recursive timers for this and following tests', () => {
  jest.useFakeTimers({timerLimit: 5000});
  // ...
});
```

:::tip

Instead of including `jest.useFakeTimers()` in each test file, you can enable fake timers globally for all tests in your Jest configuration:

```js tab
/** @type {import('jest').Config} */
const config = {
  fakeTimers: {
    enableGlobally: true,
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  fakeTimers: {
    enableGlobally: true,
  },
};

export default config;
```

:::

Configuration options:

```ts
type FakeableAPI =
  | 'Date'
  | 'hrtime'
  | 'nextTick'
  | 'performance'
  | 'queueMicrotask'
  | 'requestAnimationFrame'
  | 'cancelAnimationFrame'
  | 'requestIdleCallback'
  | 'cancelIdleCallback'
  | 'setImmediate'
  | 'clearImmediate'
  | 'setInterval'
  | 'clearInterval'
  | 'setTimeout'
  | 'clearTimeout';

type ModernFakeTimersConfig = {
  /**
   * If set to `true` all timers will be advanced automatically by 20 milliseconds
   * every 20 milliseconds. A custom time delta may be provided by passing a number.
   * The default is `false`.
   */
  advanceTimers?: boolean | number;
  /**
   * List of names of APIs that should not be faked. The default is `[]`, meaning
   * all APIs are faked.
   */
  doNotFake?: Array<FakeableAPI>;
  /** Whether fake timers should be enabled for all test files. The default is `false`. */
  enableGlobally?: boolean;
  /**
   * Use the old fake timers implementation instead of one backed by `@sinonjs/fake-timers`.
   * The default is `false`.
   */
  legacyFakeTimers?: boolean;
  /** Sets current system time to be used by fake timers, in milliseconds. The default is `Date.now()`. */
  now?: number;
  /** Maximum number of recursive timers that will be run. The default is `100_000` timers. */
  timerLimit?: number;
};
```

:::info Legacy Fake Timers

For some reason you might have to use legacy implementation of fake timers. Here is how to enable it globally (additional options are not supported):

```js tab
/** @type {import('jest').Config} */
const config = {
  fakeTimers: {
    enableGlobally: true,
    legacyFakeTimers: true,
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  fakeTimers: {
    enableGlobally: true,
    legacyFakeTimers: true,
  },
};

export default config;
```

:::

### `forceCoverageMatch` \[array&lt;string&gt;]

Default: `['']`

Test files are normally ignored from collecting code coverage. With this option, you can overwrite this behavior and include otherwise ignored files in code coverage.

For example, if you have tests in source files named with `.t.js` extension as following:

```javascript title="sum.t.js"
export function sum(a, b) {
  return a + b;
}

if (process.env.NODE_ENV === 'test') {
  test('sum', () => {
    expect(sum(1, 2)).toBe(3);
  });
}
```

You can collect coverage from those files with setting `forceCoverageMatch`.

```js tab
/** @type {import('jest').Config} */
const config = {
  forceCoverageMatch: ['**/*.t.js'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  forceCoverageMatch: ['**/*.t.js'],
};

export default config;
```

### `globals` \[object]

Default: `{}`

A set of global variables that need to be available in all test environments.

For example, the following would create a global `__DEV__` variable set to `true` in all test environments:

```js tab
/** @type {import('jest').Config} */
const config = {
  globals: {
    __DEV__: true,
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  globals: {
    __DEV__: true,
  },
};

export default config;
```

:::note

If you specify a global reference value (like an object or array) here, and some code mutates that value in the midst of running a test, that mutation will _not_ be persisted across test runs for other test files. In addition, the `globals` object must be json-serializable, so it can't be used to specify global functions. For that, you should use `setupFiles`.

:::

### `globalSetup` \[string]

Default: `undefined`

This option allows the use of a custom global setup module, which must export a function (it can be sync or async). The function will be triggered once before all test suites and it will receive two arguments: Jest's [`globalConfig`](https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L358-L422) and [`projectConfig`](https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L424-L481).

:::info

A global setup module configured in a project (using multi-project runner) will be triggered only when you run at least one test from this project.

Any global variables that are defined through `globalSetup` can only be read in `globalTeardown`. You cannot retrieve globals defined here in your test suites.

While code transformation is applied to the linked setup-file, Jest will **not** transform any code in `node_modules`. This is due to the need to load the actual transformers (e.g. `babel` or `typescript`) to perform transformation.

:::

```js title="setup.js"
module.exports = async function (globalConfig, projectConfig) {
  console.log(globalConfig.testPathPattern);
  console.log(projectConfig.cache);

  // Set reference to mongod in order to close the server during teardown.
  globalThis.__MONGOD__ = mongod;
};
```

```js title="teardown.js"
module.exports = async function (globalConfig, projectConfig) {
  console.log(globalConfig.testPathPattern);
  console.log(projectConfig.cache);

  await globalThis.__MONGOD__.stop();
};
```

### `globalTeardown` \[string]

Default: `undefined`

This option allows the use of a custom global teardown module which must export a function (it can be sync or async). The function will be triggered once after all test suites and it will receive two arguments: Jest's [`globalConfig`](https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L358-L422) and [`projectConfig`](https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L424-L481).

:::info

A global teardown module configured in a project (using multi-project runner) will be triggered only when you run at least one test from this project.

The same caveat concerning transformation of `node_modules` as for `globalSetup` applies to `globalTeardown`.

:::

### `haste` \[object]

Default: `undefined`

This will be used to configure the behavior of `jest-haste-map`, Jest's internal file crawler/cache system. The following options are supported:

```ts
type HasteConfig = {
  /** Whether to hash files using SHA-1. */
  computeSha1?: boolean;
  /** The platform to use as the default, e.g. 'ios'. */
  defaultPlatform?: string | null;
  /** Force use of Node's `fs` APIs rather than shelling out to `find` */
  forceNodeFilesystemAPI?: boolean;
  /**
   * Whether to follow symlinks when crawling for files.
   *   This options cannot be used in projects which use watchman.
   *   Projects with `watchman` set to true will error if this option is set to true.
   */
  enableSymlinks?: boolean;
  /** Path to a custom implementation of Haste. */
  hasteImplModulePath?: string;
  /** All platforms to target, e.g ['ios', 'android']. */
  platforms?: Array<string>;
  /** Whether to throw on error on module collision. */
  throwOnModuleCollision?: boolean;
  /** Custom HasteMap module */
  hasteMapModulePath?: string;
  /** Whether to retain all files, allowing e.g. search for tests in `node_modules`. */
  retainAllFiles?: boolean;
};
```

### `injectGlobals` \[boolean]

Default: `true`

Insert Jest's globals (`expect`, `test`, `describe`, `beforeEach` etc.) into the global environment. If you set this to `false`, you should import from `@jest/globals`, e.g.

```ts
import {expect, jest, test} from '@jest/globals';

jest.useFakeTimers();

test('some test', () => {
  expect(Date.now()).toBe(0);
});
```

:::note

This option is only supported using the default `jest-circus` test runner.

:::

### `maxConcurrency` \[number]

Default: `5`

A number limiting the number of tests that are allowed to run at the same time when using `test.concurrent`. Any test above this limit will be queued and executed once a slot is released.

### `maxWorkers` \[number | string]

Specifies the maximum number of workers the worker-pool will spawn for running tests. In single run mode, this defaults to the number of the cores available on your machine minus one for the main thread. In watch mode, this defaults to half of the available cores on your machine to ensure Jest is unobtrusive and does not grind your machine to a halt. It may be useful to adjust this in resource limited environments like CIs but the defaults should be adequate for most use-cases.

For environments with variable CPUs available, you can use percentage based configuration:

```js tab
/** @type {import('jest').Config} */
const config = {
  maxWorkers: '50%',
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  maxWorkers: '50%',
};

export default config;
```

### `moduleDirectories` \[array&lt;string&gt;]

Default: `["node_modules"]`

An array of directory names to be searched recursively up from the requiring module's location. Setting this option will _override_ the default, if you wish to still search `node_modules` for packages include it along with any other options:

```js tab
/** @type {import('jest').Config} */
const config = {
  moduleDirectories: ['node_modules', 'bower_components'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  moduleDirectories: ['node_modules', 'bower_components'],
};

export default config;
```

:::caution

It is discouraged to use `'.'` as one of the `moduleDirectories`, because this prevents scoped packages such as `@emotion/react` from accessing packages with the same subdirectory name (`react`). See [this issue](https://github.com/jestjs/jest/issues/10498) for more details. In most cases, it is preferable to use the [moduleNameMapper](#modulenamemapper-objectstring-string--arraystring) configuration instead.

:::

### `moduleFileExtensions` \[array&lt;string&gt;]

Default: `["js", "mjs", "cjs", "jsx", "ts", "tsx", "json", "node"]`

An array of file extensions your modules use. If you require modules without specifying a file extension, these are the extensions Jest will look for, in left-to-right order.

We recommend placing the extensions most commonly used in your project on the left, so if you are using TypeScript, you may want to consider moving "ts" and/or "tsx" to the beginning of the array.

### `moduleNameMapper` \[object&lt;string, string | array&lt;string>&gt;]

Default: `null`

A map from regular expressions to module names or to arrays of module names that allow to stub out resources, like images or styles with a single module.

Modules that are mapped to an alias are unmocked by default, regardless of whether automocking is enabled or not.

Use `<rootDir>` string token to refer to [`rootDir`](#rootdir-string) value if you want to use file paths.

Additionally, you can substitute captured regex groups using numbered backreferences.

```js tab
/** @type {import('jest').Config} */
const config = {
  moduleNameMapper: {
    '^image![a-zA-Z0-9$_-]+$': 'GlobalImageStub',
    '^[./a-zA-Z0-9$_-]+\\.png$': '<rootDir>/RelativeImageStub.js',
    'module_name_(.*)': '<rootDir>/substituted_module_$1.js',
    'assets/(.*)': [
      '<rootDir>/images/$1',
      '<rootDir>/photos/$1',
      '<rootDir>/recipes/$1',
    ],
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  moduleNameMapper: {
    '^image![a-zA-Z0-9$_-]+$': 'GlobalImageStub',
    '^[./a-zA-Z0-9$_-]+\\.png$': '<rootDir>/RelativeImageStub.js',
    'module_name_(.*)': '<rootDir>/substituted_module_$1.js',
    'assets/(.*)': [
      '<rootDir>/images/$1',
      '<rootDir>/photos/$1',
      '<rootDir>/recipes/$1',
    ],
  },
};

export default config;
```

The order in which the mappings are defined matters. Patterns are checked one by one until one fits. The most specific rule should be listed first. This is true for arrays of module names as well.

:::info

If you provide module names without boundaries `^$` it may cause hard to spot errors. E.g. `relay` will replace all modules which contain `relay` as a substring in its name: `relay`, `react-relay` and `graphql-relay` will all be pointed to your stub.

:::

### `modulePathIgnorePatterns` \[array&lt;string&gt;]

Default: `[]`

An array of regexp pattern strings that are matched against all module paths before those paths are to be considered 'visible' to the module loader. If a given module's path matches any of the patterns, it will not be `require()`-able in the test environment.

These pattern strings match against the full path. Use the `<rootDir>` string token to include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories.

```js tab
/** @type {import('jest').Config} */
const config = {
  modulePathIgnorePatterns: ['<rootDir>/build/'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  modulePathIgnorePatterns: ['<rootDir>/build/'],
};

export default config;
```

### `modulePaths` \[array&lt;string&gt;]

Default: `[]`

An alternative API to setting the `NODE_PATH` env variable, `modulePaths` is an array of absolute paths to additional locations to search when resolving modules. Use the `<rootDir>` string token to include the path to your project's root directory.

```js tab
/** @type {import('jest').Config} */
const config = {
  modulePaths: ['<rootDir>/app/'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  modulePaths: ['<rootDir>/app/'],
};

export default config;
```

### `notify` \[boolean]

Default: `false`

Activates native OS notifications for test results. To display the notifications Jest needs [`node-notifier`](https://github.com/mikaelbr/node-notifier) package, which must be installed additionally:

```bash npm2yarn
npm install --save-dev node-notifier
```

:::tip

On macOS, remember to allow notifications from `terminal-notifier` under System Preferences > Notifications & Focus.

On Windows, `node-notifier` creates a new start menu entry on the first use and not display the notification. Notifications will be properly displayed on subsequent runs.

:::

### `notifyMode` \[string]

Default: `failure-change`

Specifies notification mode. Requires `notify: true`.

#### Modes

- `always`: always send a notification.
- `failure`: send a notification when tests fail.
- `success`: send a notification when tests pass.
- `change`: send a notification when the status changed.
- `success-change`: send a notification when tests pass or once when it fails.
- `failure-change`: send a notification when tests fail or once when it passes.

### `openHandlesTimeout` \[number]

Default: `1000`

Print a warning indicating that there are probable open handles if Jest does not exit cleanly this number of milliseconds after it completes. Use `0` to disable the warning.

### `passWithNoTests` \[boolean]

Default: `false`

The equivalent of the [`--passWithNoTests`](CLI.md#--passwithnotests) flag allows the test suite to pass even when no test files are found.

### `preset` \[string]

Default: `undefined`

A preset that is used as a base for Jest's configuration. A preset should point to an npm module that has a `jest-preset.json`, `jest-preset.js`, `jest-preset.cjs` or `jest-preset.mjs` file at the root.

For example, this preset `foo-bar/jest-preset.js` will be configured as follows:

```js tab
/** @type {import('jest').Config} */
const config = {
  preset: 'foo-bar',
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  preset: 'foo-bar',
};

export default config;
```

Presets may also be relative to filesystem paths:

```js tab
/** @type {import('jest').Config} */
const config = {
  preset: './node_modules/foo-bar/jest-preset.js',
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  preset: './node_modules/foo-bar/jest-preset.js',
};

export default config;
```

:::info

If you also have specified [`rootDir`](#rootdir-string), the resolution of this file will be relative to that root directory.

:::

### `prettierPath` \[string]

Default: `'prettier'`

Sets the path to the [`prettier`](https://prettier.io/) node module used to update inline snapshots.

<details>
<summary>Prettier version 3 is not supported!</summary>

You can either pass `prettierPath: null` in your config to disable using prettier if you don't need it, or use v2 of Prettier solely for Jest.

```json title="package.json"
{
  "devDependencies": {
    "prettier-2": "npm:prettier@^2"
  }
}
```

```js tab
/** @type {import('jest').Config} */
const config = {
  prettierPath: require.resolve('prettier-2'),
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  prettierPath: require.resolve('prettier-2'),
};

export default config;
```

We hope to support Prettier v3 seamlessly out of the box in a future version of Jest. See [this](https://github.com/jestjs/jest/issues/14305) tracking issue.

</details>

### `projects` \[array&lt;string | ProjectConfig&gt;]

Default: `undefined`

When the `projects` configuration is provided with an array of paths or glob patterns, Jest will run tests in all of the specified projects at the same time. This is great for monorepos or when working on multiple projects at the same time.

```js tab
/** @type {import('jest').Config} */
const config = {
  projects: ['<rootDir>', '<rootDir>/examples/*'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  projects: ['<rootDir>', '<rootDir>/examples/*'],
};

export default config;
```

This example configuration will run Jest in the root directory as well as in every folder in the examples directory. You can have an unlimited amount of projects running in the same Jest instance.

The projects feature can also be used to run multiple configurations or multiple [runners](#runner-string). For this purpose, you can pass an array of configuration objects. For example, to run both tests and ESLint (via [jest-runner-eslint](https://github.com/jest-community/jest-runner-eslint)) in the same invocation of Jest:

```js tab
/** @type {import('jest').Config} */
const config = {
  projects: [
    {
      displayName: 'test',
    },
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.js'],
    },
  ],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'test',
    },
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.js'],
    },
  ],
};

export default config;
```

:::tip

When using multi-project runner, it's recommended to add a `displayName` for each project. This will show the `displayName` of a project next to its tests.

:::

:::note

With the `projects` option enabled, Jest will copy the root-level configuration options to each individual child configuration during the test run, resolving its values in the child's context. This means that string tokens like `<rootDir>` will point to the _child's root directory_ even if they are defined in the root-level configuration.

:::

### `randomize` \[boolean]

Default: `false`

The equivalent of the [`--randomize`](CLI.md#--randomize) flag to randomize the order of the tests in a file.

### `reporters` \[array&lt;moduleName | \[moduleName, options]&gt;]

Default: `undefined`

Use this configuration option to add reporters to Jest. It must be a list of reporter names, additional options can be passed to a reporter using the tuple form:

```js tab
/** @type {import('jest').Config} */
const config = {
  reporters: [
    'default',
    ['<rootDir>/custom-reporter.js', {banana: 'yes', pineapple: 'no'}],
  ],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  reporters: [
    'default',
    ['<rootDir>/custom-reporter.js', {banana: 'yes', pineapple: 'no'}],
  ],
};

export default config;
```

#### Default Reporter

If custom reporters are specified, the default Jest reporter will be overridden. If you wish to keep it, `'default'` must be passed as a reporters name:

```js tab
/** @type {import('jest').Config} */
const config = {
  reporters: [
    'default',
    ['jest-junit', {outputDirectory: 'reports', outputName: 'report.xml'}],
  ],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  reporters: [
    'default',
    ['jest-junit', {outputDirectory: 'reports', outputName: 'report.xml'}],
  ],
};

export default config;
```

#### GitHub Actions Reporter

If included in the list, the built-in GitHub Actions Reporter will annotate changed files with test failure messages and (if used with `'silent: false'`) print logs with github group features for easy navigation. Note that `'default'` should not be used in this case as `'github-actions'` will handle that already, so remember to also include `'summary'`. If you wish to use it only for annotations simply leave only the reporter without options as the default value of `'silent'` is `'true'`:

```js tab
/** @type {import('jest').Config} */
const config = {
  reporters: [['github-actions', {silent: false}], 'summary'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  reporters: [['github-actions', {silent: false}], 'summary'],
};

export default config;
```

#### Summary Reporter

Summary reporter prints out summary of all tests. It is a part of default reporter, hence it will be enabled if `'default'` is included in the list. For instance, you might want to use it as stand-alone reporter instead of the default one, or together with [Silent Reporter](https://github.com/rickhanlonii/jest-silent-reporter):

```js tab
/** @type {import('jest').Config} */
const config = {
  reporters: ['jest-silent-reporter', 'summary'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  reporters: ['jest-silent-reporter', 'summary'],
};

export default config;
```

The `summary` reporter accepts options. Since it is included in the `default` reporter you may also pass the options there.

```js tab
/** @type {import('jest').Config} */
const config = {
  reporters: [['default', {summaryThreshold: 10}]],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  reporters: [['default', {summaryThreshold: 10}]],
};

export default config;
```

The `summaryThreshold` option behaves in the following way, if the total number of test suites surpasses this threshold, a detailed summary of all failed tests will be printed after executing all the tests. It defaults to `20`.

#### Custom Reporters

:::tip

Hungry for reporters? Take a look at long list of [awesome reporters](https://github.com/jest-community/awesome-jest/blob/main/README.md#reporters) from Awesome Jest.

:::

Custom reporter module must export a class that takes [`globalConfig`](https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L358-L422), `reporterOptions` and `reporterContext` as constructor arguments:

```js title="custom-reporter.js"
class CustomReporter {
  constructor(globalConfig, reporterOptions, reporterContext) {
    this._globalConfig = globalConfig;
    this._options = reporterOptions;
    this._context = reporterContext;
  }

  onRunComplete(testContexts, results) {
    console.log('Custom reporter output:');
    console.log('global config:', this._globalConfig);
    console.log('options for this reporter from Jest config:', this._options);
    console.log('reporter context passed from test scheduler:', this._context);
  }

  // Optionally, reporters can force Jest to exit with non zero code by returning
  // an `Error` from `getLastError()` method.
  getLastError() {
    if (this._shouldFail) {
      return new Error('Custom error reported!');
    }
  }
}

module.exports = CustomReporter;
```

:::note

For the full list of hooks and argument types see the `Reporter` interface in [packages/jest-reporters/src/types.ts](https://github.com/jestjs/jest/blob/main/packages/jest-reporters/src/types.ts).

:::

### `resetMocks` \[boolean]

Default: `false`

Automatically reset mock state before every test. Equivalent to calling [`jest.resetAllMocks()`](JestObjectAPI.md#jestresetallmocks) before each test. This will lead to any mocks having their fake implementations removed but does not restore their initial implementation.

### `resetModules` \[boolean]

Default: `false`

By default, each test file gets its own independent module registry. Enabling `resetModules` goes a step further and resets the module registry before running each individual test. This is useful to isolate modules for every test so that the local module state doesn't conflict between tests. This can be done programmatically using [`jest.resetModules()`](JestObjectAPI.md#jestresetmodules).

### `resolver` \[string]

Default: `undefined`

This option allows the use of a custom resolver. This resolver must be a module that exports _either_:

1. a function expecting a string as the first argument for the path to resolve and an options object as the second argument. The function should either return a path to the module that should be resolved or throw an error if the module can't be found. _or_
2. an object containing `async` and/or `sync` properties. The `sync` property should be a function with the shape explained above, and the `async` property should also be a function that accepts the same arguments, but returns a promise which resolves with the path to the module or rejects with an error.

The options object provided to resolvers has the shape:

```ts
type ResolverOptions = {
  /** Directory to begin resolving from. */
  basedir: string;
  /** List of export conditions. */
  conditions?: Array<string>;
  /** Instance of default resolver. */
  defaultResolver: (path: string, options: ResolverOptions) => string;
  /** List of file extensions to search in order. */
  extensions?: Array<string>;
  /** List of directory names to be looked up for modules recursively. */
  moduleDirectory?: Array<string>;
  /** List of `require.paths` to use if nothing is found in `node_modules`. */
  paths?: Array<string>;
  /** Allows transforming parsed `package.json` contents. */
  packageFilter?: (pkg: PackageJSON, file: string, dir: string) => PackageJSON;
  /** Allows transforms a path within a package. */
  pathFilter?: (pkg: PackageJSON, path: string, relativePath: string) => string;
  /** Current root directory. */
  rootDir?: string;
};
```

:::tip

The `defaultResolver` passed as an option is the Jest default resolver which might be useful when you write your custom one. It takes the same arguments as your custom synchronous one, e.g. `(path, options)` and returns a string or throws.

:::

For example, if you want to respect Browserify's [`"browser"` field](https://github.com/browserify/browserify-handbook/blob/master/readme.markdown#browser-field), you can use the following resolver:

```js title="resolver.js"
const browserResolve = require('browser-resolve');

module.exports = browserResolve.sync;
```

And add it to Jest configuration:

```js tab
/** @type {import('jest').Config} */
const config = {
  resolver: '<rootDir>/resolver.js',
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  resolver: '<rootDir>/resolver.js',
};

export default config;
```

By combining `defaultResolver` and `packageFilter` we can implement a `package.json` "pre-processor" that allows us to change how the default resolver will resolve modules. For example, imagine we want to use the field `"module"` if it is present, otherwise fallback to `"main"`:

```js
module.exports = (path, options) => {
  // Call the defaultResolver, so we leverage its cache, error handling, etc.
  return options.defaultResolver(path, {
    ...options,
    // Use packageFilter to process parsed `package.json` before the resolution (see https://www.npmjs.com/package/resolve#resolveid-opts-cb)
    packageFilter: pkg => {
      return {
        ...pkg,
        // Alter the value of `main` before resolving the package
        main: pkg.module || pkg.main,
      };
    },
  });
};
```

### `restoreMocks` \[boolean]

Default: `false`

Automatically restore mock state and implementation before every test. Equivalent to calling [`jest.restoreAllMocks()`](JestObjectAPI.md#jestrestoreallmocks) before each test. This will lead to any mocks having their fake implementations removed and restores their initial implementation.

### `rootDir` \[string]

Default: The root of the directory containing your Jest [config file](#) _or_ the `package.json` _or_ the [`pwd`](http://en.wikipedia.org/wiki/Pwd) if no `package.json` is found

The root directory that Jest should scan for tests and modules within. If you put your Jest config inside your `package.json` and want the root directory to be the root of your repo, the value for this config param will default to the directory of the `package.json`.

Oftentimes, you'll want to set this to `'src'` or `'lib'`, corresponding to where in your repository the code is stored.

:::tip

Using `'<rootDir>'` as a string token in any other path-based configuration settings will refer back to this value. For example, if you want a [`setupFiles`](#setupfiles-array) entry to point at the `some-setup.js` file at the root of the project, set its value to: `'<rootDir>/some-setup.js'`.

:::

### `roots` \[array&lt;string&gt;]

Default: `["<rootDir>"]`

A list of paths to directories that Jest should use to search for files in.

There are times where you only want Jest to search in a single sub-directory (such as cases where you have a `src/` directory in your repo), but prevent it from accessing the rest of the repo.

:::info

While `rootDir` is mostly used as a token to be re-used in other configuration options, `roots` is used by the internals of Jest to locate **test files and source files**. This applies also when searching for manual mocks for modules from `node_modules` (`__mocks__` will need to live in one of the `roots`).

By default, `roots` has a single entry `<rootDir>` but there are cases where you may want to have multiple roots within one project, for example `roots: ["<rootDir>/src/", "<rootDir>/tests/"]`.

:::

### `runner` \[string]

Default: `"jest-runner"`

This option allows you to use a custom runner instead of Jest's default test runner. Examples of runners include:

- [`jest-runner-eslint`](https://github.com/jest-community/jest-runner-eslint)
- [`jest-runner-mocha`](https://github.com/rogeliog/jest-runner-mocha)
- [`jest-runner-tsc`](https://github.com/azz/jest-runner-tsc)
- [`jest-runner-prettier`](https://github.com/keplersj/jest-runner-prettier)

:::info

The `runner` property value can omit the `jest-runner-` prefix of the package name.

:::

To write a test-runner, export a class with which accepts [`globalConfig`](https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L358-L422) in the constructor, and has a `runTests` method with the signature:

```ts
async function runTests(
  tests: Array<Test>,
  watcher: TestWatcher,
  onStart: OnTestStart,
  onResult: OnTestSuccess,
  onFailure: OnTestFailure,
  options: TestRunnerOptions,
): Promise<void>;
```

If you need to restrict your test-runner to only run in serial rather than being executed in parallel your class should have the property `isSerial` to be set as `true`.

### `sandboxInjectedGlobals` \[array&lt;string&gt;]

:::tip

Renamed from `extraGlobals` in Jest 28.

:::

Default: `undefined`

Test files run inside a [vm](https://nodejs.org/api/vm.html), which slows calls to global context properties (e.g. `Math`). With this option you can specify extra properties to be defined inside the vm for faster lookups.

For example, if your tests call `Math` often, you can pass it by setting `sandboxInjectedGlobals`.

```js tab
/** @type {import('jest').Config} */
const config = {
  sandboxInjectedGlobals: ['Math'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  sandboxInjectedGlobals: ['Math'],
};

export default config;
```

:::note

This option has no effect if you use [native ESM](ECMAScriptModules.md).

:::

### `setupFiles` \[array]

Default: `[]`

A list of paths to modules that run some code to configure or set up the testing environment. Each setupFile will be run once per test file. Since every test runs in its own environment, these scripts will be executed in the testing environment before executing [`setupFilesAfterEnv`](#setupfilesafterenv-array) and before the test code itself.

:::tip

If your setup script is a CJS module, it may export an async function. Jest will call the function and await its result. This might be useful to fetch some data asynchronously. If the file is an ESM module, simply use top-level await to achieve the same result.

:::

### `setupFilesAfterEnv` \[array]

Default: `[]`

A list of paths to modules that run some code to configure or set up the testing framework before each test file in the suite is executed. Since [`setupFiles`](#setupfiles-array) executes before the test framework is installed in the environment, this script file presents you the opportunity of running some code immediately after the test framework has been installed in the environment but before the test code itself.

In other words, `setupFilesAfterEnv` modules are meant for code which is repeating in each test file. Having the test framework installed makes Jest [globals](GlobalAPI.md), [`jest` object](JestObjectAPI.md) and [`expect`](ExpectAPI.md) accessible in the modules. For example, you can add extra matchers from [`jest-extended`](https://github.com/jest-community/jest-extended) library or call [setup and teardown](SetupAndTeardown.md) hooks:

```js title="setup-jest.js"
const matchers = require('jest-extended');
expect.extend(matchers);

afterEach(() => {
  jest.useRealTimers();
});
```

```js tab
/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/setup-jest.js'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/setup-jest.js'],
};

export default config;
```

### `showSeed` \[boolean]

Default: `false`

The equivalent of the [`--showSeed`](CLI.md#--showseed) flag to print the seed in the test report summary.

### `slowTestThreshold` \[number]

Default: `5`

The number of seconds after which a test is considered as slow and reported as such in the results.

### `snapshotFormat` \[object]

Default: `{escapeString: false, printBasicPrototype: false}`

Allows overriding specific snapshot formatting options documented in the [pretty-format readme](https://www.npmjs.com/package/pretty-format#usage-with-options), with the exceptions of `compareKeys` and `plugins`. For example, this config would have the snapshot formatter not print a prefix for "Object" and "Array":

```js tab
/** @type {import('jest').Config} */
const config = {
  snapshotFormat: {
    printBasicPrototype: false,
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  snapshotFormat: {
    printBasicPrototype: false,
  },
};

export default config;
```

```js title="some.test.js"
test('does not show prototypes for object and array inline', () => {
  const object = {
    array: [{hello: 'Danger'}],
  };
  expect(object).toMatchInlineSnapshot(`
    {
      "array": [
        {
          "hello": "Danger",
        },
      ],
    }
  `);
});
```

### `snapshotResolver` \[string]

Default: `undefined`

The path to a module that can resolve test\<->snapshot path. This config option lets you customize where Jest stores snapshot files on disk.

```js title="custom-resolver.js"
module.exports = {
  // resolves from test to snapshot path
  resolveSnapshotPath: (testPath, snapshotExtension) =>
    testPath.replace('__tests__', '__snapshots__') + snapshotExtension,

  // resolves from snapshot to test path
  resolveTestPath: (snapshotFilePath, snapshotExtension) =>
    snapshotFilePath
      .replace('__snapshots__', '__tests__')
      .slice(0, -snapshotExtension.length),

  // Example test path, used for preflight consistency check of the implementation above
  testPathForConsistencyCheck: 'some/__tests__/example.test.js',
};
```

### `snapshotSerializers` \[array&lt;string&gt;]

Default: `[]`

A list of paths to snapshot serializer modules Jest should use for snapshot testing.

Jest has default serializers for built-in JavaScript types, HTML elements (Jest 20.0.0+), ImmutableJS (Jest 20.0.0+) and for React elements. See [snapshot test tutorial](TutorialReactNative.md#snapshot-test) for more information.

```js title="custom-serializer.js"
module.exports = {
  serialize(val, config, indentation, depth, refs, printer) {
    return `Pretty foo: ${printer(val.foo)}`;
  },

  test(val) {
    return val && Object.prototype.hasOwnProperty.call(val, 'foo');
  },
};
```

`printer` is a function that serializes a value using existing plugins.

Add `custom-serializer` to your Jest configuration:

```js tab
/** @type {import('jest').Config} */
const config = {
  snapshotSerializers: ['path/to/custom-serializer.js'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  snapshotSerializers: ['path/to/custom-serializer.js'],
};

export default config;
```

Finally tests would look as follows:

```js
test(() => {
  const bar = {
    foo: {
      x: 1,
      y: 2,
    },
  };

  expect(bar).toMatchSnapshot();
});
```

Rendered snapshot:

```json
Pretty foo: Object {
  "x": 1,
  "y": 2,
}
```

:::tip

To make a dependency explicit instead of implicit, you can call [`expect.addSnapshotSerializer`](ExpectAPI.md#expectaddsnapshotserializerserializer) to add a module for an individual test file instead of adding its path to `snapshotSerializers` in Jest configuration.

More about serializers API can be found [here](https://github.com/jestjs/jest/tree/main/packages/pretty-format/README.md#serialize).

:::

### `testEnvironment` \[string]

Default: `"node"`

The test environment that will be used for testing. The default environment in Jest is a Node.js environment. If you are building a web app, you can use a browser-like environment through [`jsdom`](https://github.com/jsdom/jsdom) instead.

By adding a `@jest-environment` docblock at the top of the file, you can specify another environment to be used for all tests in that file:

```js
/**
 * @jest-environment jsdom
 */

test('use jsdom in this test file', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
```

You can create your own module that will be used for setting up the test environment. The module must export a class with `setup`, `teardown` and `getVmContext` methods. You can also pass variables from this module to your test suites by assigning them to `this.global` object &ndash; this will make them available in your test suites as global variables. The constructor is passed [`globalConfig`](https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L358-L422) and [`projectConfig`](https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L424-L481) as its first argument, and [`testEnvironmentContext`](https://github.com/jestjs/jest/blob/491e7cb0f2daa8263caccc72d48bdce7ba759b11/packages/jest-environment/src/index.ts#L13) as its second.

The class may optionally expose an asynchronous `handleTestEvent` method to bind to events fired by [`jest-circus`](https://github.com/jestjs/jest/tree/main/packages/jest-circus). Normally, `jest-circus` test runner would pause until a promise returned from `handleTestEvent` gets fulfilled, **except for the next events**: `start_describe_definition`, `finish_describe_definition`, `add_hook`, `add_test` or `error` (for the up-to-date list you can look at [SyncEvent type in the types definitions](https://github.com/jestjs/jest/tree/main/packages/jest-types/src/Circus.ts)). That is caused by backward compatibility reasons and `process.on('unhandledRejection', callback)` signature, but that usually should not be a problem for most of the use cases.

Any docblock pragmas in test files will be passed to the environment constructor and can be used for per-test configuration. If the pragma does not have a value, it will be present in the object with its value set to an empty string. If the pragma is not present, it will not be present in the object.

To use this class as your custom environment, refer to it by its full path within the project. For example, if your class is stored in `my-custom-environment.js` in some subfolder of your project, then the annotation might look like this:

```js
/**
 * @jest-environment ./src/test/my-custom-environment
 */
```

:::info

TestEnvironment is sandboxed. Each test suite will trigger setup/teardown in their own TestEnvironment.

:::

Example:

```js
// my-custom-environment
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    console.log(config.globalConfig);
    console.log(config.projectConfig);
    this.testPath = context.testPath;
    this.docblockPragmas = context.docblockPragmas;
  }

  async setup() {
    await super.setup();
    await someSetupTasks(this.testPath);
    this.global.someGlobalObject = createGlobalObject();

    // Will trigger if docblock contains @my-custom-pragma my-pragma-value
    if (this.docblockPragmas['my-custom-pragma'] === 'my-pragma-value') {
      // ...
    }
  }

  async teardown() {
    this.global.someGlobalObject = destroyGlobalObject();
    await someTeardownTasks();
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }

  async handleTestEvent(event, state) {
    if (event.name === 'test_start') {
      // ...
    }
  }
}

module.exports = CustomEnvironment;
```

```js
// my-test-suite
/**
 * @jest-environment ./my-custom-environment
 */
let someGlobalObject;

beforeAll(() => {
  someGlobalObject = globalThis.someGlobalObject;
});
```

### `testEnvironmentOptions` \[Object]

Default: `{}`

Test environment options that will be passed to the `testEnvironment`. The relevant options depend on the environment.

For example, you can override options passed to [`jsdom`](https://github.com/jsdom/jsdom):

```js tab
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    html: '<html lang="zh-cmn-Hant"></html>',
    url: 'https://jestjs.io/',
    userAgent: 'Agent/007',
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    html: '<html lang="zh-cmn-Hant"></html>',
    url: 'https://jestjs.io/',
    userAgent: 'Agent/007',
  },
};

export default config;
```

Both `jest-environment-jsdom` and `jest-environment-node` allow specifying `customExportConditions`, which allow you to control which versions of a library are loaded from `exports` in `package.json`. `jest-environment-jsdom` defaults to `['browser']`. `jest-environment-node` defaults to `['node', 'node-addons']`.

```js tab
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['react-native'],
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['react-native'],
  },
};

export default config;
```

These options can also be passed in a docblock, similar to `testEnvironment`. The string with options must be parseable by `JSON.parse`:

```js
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */

test('use jsdom and set the URL in this test file', () => {
  expect(window.location.href).toBe('https://jestjs.io/');
});
```

### `testFailureExitCode` \[number]

Default: `1`

The exit code Jest returns on test failure.

:::info

This does not change the exit code in the case of Jest errors (e.g. invalid configuration).

:::

### `testMatch` \[array&lt;string&gt;]

(default: `[ "**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)" ]`)

The glob patterns Jest uses to detect test files. By default it looks for `.js`, `.jsx`, `.ts` and `.tsx` files inside of `__tests__` folders, as well as any files with a suffix of `.test` or `.spec` (e.g. `Component.test.js` or `Component.spec.js`). It will also find files called `test.js` or `spec.js`.

See the [micromatch](https://github.com/micromatch/micromatch) package for details of the patterns you can specify.

See also [`testRegex` [string | array&lt;string&gt;]](#testregex-string--arraystring), but note that you cannot specify both options.

:::tip

Each glob pattern is applied in the order they are specified in the config. For example `["!**/__fixtures__/**", "**/__tests__/**/*.js"]` will not exclude `__fixtures__` because the negation is overwritten with the second pattern. In order to make the negated glob work in this example it has to come after `**/__tests__/**/*.js`.

:::

### `testPathIgnorePatterns` \[array&lt;string&gt;]

Default: `["/node_modules/"]`

An array of regexp pattern strings that are matched against all test paths before executing the test. If the test path matches any of the patterns, it will be skipped.

These pattern strings match against the full path. Use the `<rootDir>` string token to include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories. Example: `["<rootDir>/build/", "<rootDir>/node_modules/"]`.

### `testRegex` \[string | array&lt;string&gt;]

Default: `(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$`

The pattern or patterns Jest uses to detect test files. By default it looks for `.js`, `.jsx`, `.ts` and `.tsx` files inside of `__tests__` folders, as well as any files with a suffix of `.test` or `.spec` (e.g. `Component.test.js` or `Component.spec.js`). It will also find files called `test.js` or `spec.js`. See also [`testMatch` [array&lt;string&gt;]](#testmatch-arraystring), but note that you cannot specify both options.

The following is a visualization of the default regex:

```bash
├── __tests__
│   └── component.spec.js # test
│   └── anything # test
├── package.json # not test
├── foo.test.js # test
├── bar.spec.jsx # test
└── component.js # not test
```

:::info

`testRegex` will try to detect test files using the **absolute file path**, therefore, having a folder with a name that matches it will run all the files as tests.

:::

### `testResultsProcessor` \[string]

Default: `undefined`

This option allows the use of a custom results processor. This processor must be a node module that exports a function expecting an object with the following structure as the first argument and return it:

```json
{
  "success": boolean,
  "startTime": epoch,
  "numTotalTestSuites": number,
  "numPassedTestSuites": number,
  "numFailedTestSuites": number,
  "numRuntimeErrorTestSuites": number,
  "numTotalTests": number,
  "numPassedTests": number,
  "numFailedTests": number,
  "numPendingTests": number,
  "numTodoTests": number,
  "openHandles": Array<Error>,
  "testResults": [{
    "numFailingTests": number,
    "numPassingTests": number,
    "numPendingTests": number,
    "testResults": [{
      "title": string (message in it block),
      "status": "failed" | "pending" | "passed",
      "ancestorTitles": [string (message in describe blocks)],
      "failureMessages": [string],
      "numPassingAsserts": number,
      "location": {
        "column": number,
        "line": number
      },
      "duration": number | null
    },
    ...
    ],
    "perfStats": {
      "start": epoch,
      "end": epoch
    },
    "testFilePath": absolute path to test file,
    "coverage": {}
  },
  "testExecError:" (exists if there was a top-level failure) {
    "message": string
    "stack": string
  }
  ...
  ]
}
```

`testResultsProcessor` and `reporters` are very similar to each other. One difference is that a test result processor only gets called after all tests finished. Whereas a reporter has the ability to receive test results after individual tests and/or test suites are finished.

### `testRunner` \[string]

Default: `jest-circus/runner`

This option allows the use of a custom test runner. The default is `jest-circus`. A custom test runner can be provided by specifying a path to a test runner implementation.

The test runner module must export a function with the following signature:

```ts
function testRunner(
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  environment: Environment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult>;
```

An example of such function can be found in our default [jasmine2 test runner package](https://github.com/jestjs/jest/blob/main/packages/jest-jasmine2/src/index.ts).

### `testSequencer` \[string]

Default: `@jest/test-sequencer`

This option allows you to use a custom sequencer instead of Jest's default.

:::tip

Both `sort` and `shard` may optionally return a `Promise`.

:::

For example, you may sort test paths alphabetically:

```js title="custom-sequencer.js"
const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  /**
   * Select tests for shard requested via --shard=shardIndex/shardCount
   * Sharding is applied before sorting
   */
  shard(tests, {shardIndex, shardCount}) {
    const shardSize = Math.ceil(tests.length / shardCount);
    const shardStart = shardSize * (shardIndex - 1);
    const shardEnd = shardSize * shardIndex;

    return [...tests]
      .sort((a, b) => (a.path > b.path ? 1 : -1))
      .slice(shardStart, shardEnd);
  }

  /**
   * Sort test to determine order of execution
   * Sorting is applied after sharding
   */
  sort(tests) {
    // Test structure information
    // https://github.com/jestjs/jest/blob/6b8b1404a1d9254e7d5d90a8934087a9c9899dab/packages/jest-runner/src/types.ts#L17-L21
    const copyTests = [...tests];
    return copyTests.sort((testA, testB) => (testA.path > testB.path ? 1 : -1));
  }
}

module.exports = CustomSequencer;
```

Add `custom-sequencer` to your Jest configuration:

```js tab
/** @type {import('jest').Config} */
const config = {
  testSequencer: 'path/to/custom-sequencer.js',
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  testSequencer: 'path/to/custom-sequencer.js',
};

export default config;
```

### `testTimeout` \[number]

Default: `5000`

Default timeout of a test in milliseconds.

### `transform` \[object&lt;string, pathToTransformer | \[pathToTransformer, object]&gt;]

Default: `{"\\.[jt]sx?$": "babel-jest"}`

A map from regular expressions to paths to transformers. Optionally, a tuple with configuration options can be passed as second argument: `{filePattern: ['path-to-transformer', {options}]}`. For example, here is how you can configure `babel-jest` for non-default behavior: `{'\\.js$': ['babel-jest', {rootMode: 'upward'}]}`.

Jest runs the code of your project as JavaScript, hence a transformer is needed if you use some syntax not supported by Node out of the box (such as JSX, TypeScript, Vue templates). By default, Jest will use [`babel-jest`](https://github.com/jestjs/jest/tree/main/packages/babel-jest#setup) transformer, which will load your project's Babel configuration and transform any file matching the `/\.[jt]sx?$/` RegExp (in other words, any `.js`, `.jsx`, `.ts` or `.tsx` file). In addition, `babel-jest` will inject the Babel plugin necessary for mock hoisting talked about in [ES Module mocking](ManualMocks.md#using-with-es-module-imports).

See the [Code Transformation](CodeTransformation.md) section for more details and instructions on building your own transformer.

:::tip

Keep in mind that a transformer only runs once per file unless the file has changed.

Remember to include the default `babel-jest` transformer explicitly, if you wish to use it alongside with additional code preprocessors:

```js tab
/** @type {import('jest').Config} */
const config = {
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
    '\\.css$': 'some-css-transformer',
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
    '\\.css$': 'some-css-transformer',
  },
};

export default config;
```

:::

### `transformIgnorePatterns` \[array&lt;string&gt;]

Default: `["/node_modules/", "\\.pnp\\.[^\\\/]+$"]`

An array of regexp pattern strings that are matched against all source file paths before transformation. If the file path matches **any** of the patterns, it will not be transformed.

Providing regexp patterns that overlap with each other may result in files not being transformed that you expected to be transformed. For example:

```js tab
/** @type {import('jest').Config} */
const config = {
  transformIgnorePatterns: ['/node_modules/(?!(foo|bar)/)', '/bar/'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  transformIgnorePatterns: ['/node_modules/(?!(foo|bar)/)', '/bar/'],
};

export default config;
```

The first pattern will match (and therefore not transform) files inside `/node_modules` except for those in `/node_modules/foo/` and `/node_modules/bar/`. The second pattern will match (and therefore not transform) files inside any path with `/bar/` in it. With the two together, files in `/node_modules/bar/` will not be transformed because it does match the second pattern, even though it was excluded by the first.

Sometimes it happens (especially in React Native or TypeScript projects) that 3rd party modules are published as untranspiled code. Since all files inside `node_modules` are not transformed by default, Jest will not understand the code in these modules, resulting in syntax errors. To overcome this, you may use `transformIgnorePatterns` to allow transpiling such modules. You'll find a good example of this use case in [React Native Guide](/docs/tutorial-react-native#transformignorepatterns-customization).

These pattern strings match against the full path. Use the `<rootDir>` string token to include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories.

```js tab
/** @type {import('jest').Config} */
const config = {
  transformIgnorePatterns: [
    '<rootDir>/bower_components/',
    '<rootDir>/node_modules/',
  ],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  transformIgnorePatterns: [
    '<rootDir>/bower_components/',
    '<rootDir>/node_modules/',
  ],
};

export default config;
```

:::tip

If you use `pnpm` and need to convert some packages under `node_modules`, you need to note that the packages in this folder (e.g. `node_modules/package-a/`) have been symlinked to the path under `.pnpm` (e.g. `node_modules/.pnpm/package-a@x.x.x/node_modules/package-a/`), so using `<rootDir>/node_modules/(?!(package-a|@scope/pkg-b)/)` directly will not be recognized, while is to use:

```js tab
/** @type {import('jest').Config} */
const config = {
  transformIgnorePatterns: [
    '<rootDir>/node_modules/.pnpm/(?!(package-a|@scope\\+pkg-b)@)',
    /* if config file is under '~/packages/lib-a/' */
    `${path.join(
      __dirname,
      '../..',
    )}/node_modules/.pnpm/(?!(package-a|@scope\\+pkg-b)@)`,
    /* or using relative pattern to match the second 'node_modules/' in 'node_modules/.pnpm/@scope+pkg-b@x.x.x/node_modules/@scope/pkg-b/' */
    'node_modules/(?!.pnpm|package-a|@scope/pkg-b)',
  ],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  transformIgnorePatterns: [
    '<rootDir>/node_modules/.pnpm/(?!(package-a|@scope\\+pkg-b)@)',
    /* if config file is under '~/packages/lib-a/' */
    `${path.join(
      __dirname,
      '../..',
    )}/node_modules/.pnpm/(?!(package-a|@scope\\+pkg-b)@)`,
    /* or using relative path to match the second 'node_modules/' in 'node_modules/.pnpm/@scope+pkg-b@x.x.x/node_modules/@scope/pkg-b/' */
    'node_modules/(?!.pnpm|package-a|@scope/pkg-b)',
  ],
};

export default config;
```

It should be noted that the folder name of pnpm under `.pnpm` is the package name plus `@` and version number, so writing `/` will not be recognized, but using `@` can.

:::

### `unmockedModulePathPatterns` \[array&lt;string&gt;]

Default: `[]`

An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them. If a module's path matches any of the patterns in this list, it will not be automatically mocked by the module loader.

This is useful for some commonly used 'utility' modules that are almost always used as implementation details almost all the time (like `underscore`, `lodash`, etc). It's generally a best practice to keep this list as small as possible and always use explicit `jest.mock()`/`jest.unmock()` calls in individual tests. Explicit per-test setup is far easier for other readers of the test to reason about the environment the test will run in.

It is possible to override this setting in individual tests by explicitly calling `jest.mock()` at the top of the test file.

### `verbose` \[boolean]

Default: `false` or `true` if there is only one test file to run

Indicates whether each individual test should be reported during the run. All errors will also still be shown on the bottom after execution.

### `watchPathIgnorePatterns` \[array&lt;string&gt;]

Default: `[]`

An array of RegExp patterns that are matched against all source file paths before re-running tests in watch mode. If the file path matches any of the patterns, when it is updated, it will not trigger a re-run of tests.

These patterns match against the full path. Use the `<rootDir>` string token to include the path to your project's root directory to prevent it from accidentally ignoring all of your files in different environments that may have different root directories. Example: `["<rootDir>/node_modules/"]`.

Even if nothing is specified here, the watcher will ignore changes to the version control folders (.git, .hg, .sl). Other hidden files and directories, i.e. those that begin with a dot (`.`), are watched by default. Remember to escape the dot when you add them to `watchPathIgnorePatterns` as it is a special RegExp character.

```js tab
/** @type {import('jest').Config} */
const config = {
  watchPathIgnorePatterns: ['<rootDir>/\\.tmp/', '<rootDir>/bar/'],
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  watchPathIgnorePatterns: ['<rootDir>/\\.tmp/', '<rootDir>/bar/'],
};

export default config;
```

### `watchPlugins` \[array&lt;string | \[string, Object]&gt;]

Default: `[]`

This option allows you to use custom watch plugins. Read more about watch plugins [here](watch-plugins).

Examples of watch plugins include:

- [`jest-watch-master`](https://github.com/rickhanlonii/jest-watch-master)
- [`jest-watch-select-projects`](https://github.com/rogeliog/jest-watch-select-projects)
- [`jest-watch-suspend`](https://github.com/unional/jest-watch-suspend)
- [`jest-watch-typeahead`](https://github.com/jest-community/jest-watch-typeahead)
- [`jest-watch-yarn-workspaces`](https://github.com/cameronhunter/jest-watch-directories/tree/master/packages/jest-watch-yarn-workspaces)

:::info

The values in the `watchPlugins` property value can omit the `jest-watch-` prefix of the package name.

:::

### `watchman` \[boolean]

Default: `true`

Whether to use [`watchman`](https://facebook.github.io/watchman/) for file crawling.

### `workerIdleMemoryLimit` \[number|string]

Default: `undefined`

Specifies the memory limit for workers before they are recycled and is primarily a work-around for [this issue](https://github.com/jestjs/jest/issues/11956);

After the worker has executed a test the memory usage of it is checked. If it exceeds the value specified the worker is killed and restarted. The limit can be specified in a number of different ways and whatever the result is `Math.floor` is used to turn it into an integer value:

- `<= 1` - The value is assumed to be a percentage of system memory. So 0.5 sets the memory limit of the worker to half of the total system memory
- `\> 1` - Assumed to be a fixed byte value. Because of the previous rule if you wanted a value of 1 byte (I don't know why) you could use `1.1`.
- With units
  - `50%` - As above, a percentage of total system memory
  - `100KB`, `65MB`, etc - With units to denote a fixed memory limit.
    - `K` / `KB` - Kilobytes (x1000)
    - `KiB` - Kibibytes (x1024)
    - `M` / `MB` - Megabytes
    - `MiB` - Mebibytes
    - `G` / `GB` - Gigabytes
    - `GiB` - Gibibytes

:::caution

Percentage based memory limit [does not work on Linux CircleCI workers](https://github.com/jestjs/jest/issues/11956#issuecomment-1212925677) due to incorrect system memory being reported.

:::

```js tab
/** @type {import('jest').Config} */
const config = {
  workerIdleMemoryLimit: 0.2,
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  workerIdleMemoryLimit: 0.2,
};

export default config;
```

### `//` \[string]

This option allows comments in `package.json`. Include the comment text as the value of this key:

```json title="package.json"
{
  "name": "my-project",
  "jest": {
    "//": "Comment goes here",
    "verbose": true
  }
}
```

### `workerThreads`

Default: `false`

Whether to use [worker threads](https://nodejs.org/dist/latest/docs/api/worker_threads.html) for parallelization. [Child processes](https://nodejs.org/dist/latest/docs/api/child_process.html) are used by default.

Using worker threads may help to improve [performance](https://github.com/nodejs/node/discussions/44264).

:::caution

This is **experimental feature**. Keep in mind that the worker threads use structured clone instead of `JSON.stringify()` to serialize messages. This means that built-in JavaScript objects as `BigInt`, `Map` or `Set` will get serialized properly. However extra properties set on `Error`, `Map` or `Set` will not be passed on through the serialization step. For more details see the article on [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

:::
