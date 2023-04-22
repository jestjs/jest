---
id: programmatic-api
title: Programmatic API
---

:::note

The programmatic API is useful for advanced use cases only. You normally don't need to use it if you just want to run your tests.

:::

This page documents Jest's programmable API that can be used to run jest from `node`. TypeScript types are provided.

## Simple example

```js
import jest from 'jest';

const {globalConfig, configs} = await jest.readConfigs(process.argv, ['.']);
const {result} = await jest.runCore(globalConfig, configs);
console.log(`runCore success, ${result.numPassedTests} passed tests.`);
```

This example runs Jest as the normal Jest command line interface (CLI) would.

## Programmatic API reference

### `getVersion` \[function]

Get the version number from the imported Jest.

Example:

```js
import {getVersion} from 'jest';
console.log(`jest version: ${getVersion()}`);
```

### `readConfigs` \[function]

Async function that reads the config for a given jest project, as well as its [projects](./Configuration.md#projects-arraystring--projectconfig). If no `projects`, were configured, the current project will be provided as project config.

It takes in in an array of command line arguments (for example, `process.argv`) and an array locations to search for config.

The configs that are returned are readonly and cannot be changed in-place. However, they can be used as a base to create new config objects from (see [Advanced use cases](#advanced-use-cases))

Example:

```js
import {readConfigs} from 'jest';
const {globalConfig, configs, hasDeprecationWarnings} = await readConfigs(
  process.argv,
  ['.'],
);

if (hasDeprecationWarnings) {
  console.warn('Deprecation warnings found!');
}

console.log(`Global config: ${JSON.stringify(globalConfig, null, 2)}`);
console.log(`Project specific configs: ${JSON.stringify(configs, null, 2)}`);
```

### `readInitialOptions` \[function]

Async function that reads the jest configuration without reading its [projects](./Configuration.md#projects-arraystring--projectconfig), resolving its [preset](./Configuration.md#preset-string), filling in the default values or validating the options.

```js
import {readInitialOptions} from 'jest';
const {config, configPath} = await readInitialOptions();

console.log(
  `Read options from ${configPath}: ${JSON.stringify(config, null, 2)}`,
);
```

### `runCLI` \[function]

Async function that mimics the CLI.

It takes in in an array of command line arguments (for example, `process.argv`) and an array locations to search for config.

```js
import {runCLI} from 'jest';

const {results, globalConfig} = await runCLI(process.argv, ['.']);
console.log(`runCore success, ${result.numPassedTests} passed tests.`);
```

### `runCore` \[function]

Async function that runs Jest either in watch mode or as a one-off. This is a lower-level API than `runCLI`.

```js
import {readConfigs, runCore} from 'jest';
const {globalConfig, configs} = await readConfigs(process.argv, [
  process.cwd(),
]);
const {results} = await runCore(globalConfig, configs);
console.log(results);
```

## Advanced use cases

These are more advanced use cases that demonstrate the power of the api.

### Forcing some config options

You can use `readInitialOptions` in combination with `runCLI` to run jest using the local config, while forcing some options. We're also always focussing our tests on the `foo.js` file.

```js
import {readInitialOptions, runCLI} from 'jest';

const {config} = await readInitialOptions();

// Override initial options
config.collectCoverage = false;
config.reporters = [];
config.verbose = false;
config.testResultsProcessor = undefined;

// Only run tests related to foo.js
const focussedFile = 'foo.js';
const {results} = runCLI(
  {
    $0: 'my-custom-jest-script',
    _: [focussedFile],

    // Provide `findRelatedTests`
    findRelatedTests: true,

    // Pass the initial options
    config: JSON.stringify(config),
  },
  ['.'],
);
console.log(JSON.stringify(results));
```

### Override options based on the configured options

You might want to override options based on other options. For example, you might want to provide your own version of the `jsdom` or `node` test environment.

For that to work, the initial options is not enough, because the configured preset might override the test environment.

```js
import {readConfigs, runCore} from 'jest';

// Run while overriding _some_ options
const {globalConfig, configs} = await readConfigs(process.argv, [
  process.cwd(),
]);

const projectConfig = {
  ...configs[0],
  // Change the test environment based on the configured test environment
  testEnvironment: overrideTestEnvironment(configs[0].testEnvironment),
};

const {results} = await runCore(globalConfig, [projectConfig]);
console.log(results);
```
