---
id: programmatic-api
title: Programmatic API
---

:::caution

The programmatic API is currently **experimental**. It is useful for advanced use cases only. You normally don't need to use it if you just want to run your tests.

:::

This page documents Jest's programmable API that can be used to run jest from `node`. TypeScript types are provided.

## Simple example

```js
import {createJest} from 'jest';

const jest = await createJest();
jest.globalConfig = {
  collectCoverage: false,
  watch: false,
  ...jest.globalConfig,
};
const {results} = await jest.run();
console.log(`run success, ${result.numPassedTests} passed tests.`);
```

## Programmatic API reference

### `createJest(args: Partial<Config.Argv> = {}, projectPath = ['.']): Promise<Jest>` \[function]

Create a Jest instance asynchronously. You can provide command line arguments (for example, `process.argv`) as first argument and a list of custom [projects](./Configuration.md#projects-arraystring--projectconfig) as the second argument. If no `projects`, were configured, the current project will be provided as project config.

Examples:

```js
import {createJest} from 'jest';

const jest = await createJest();
const jest2 = await createJest({config: 'jest.alternative.config.js'});
```

### `jest.globalConfig` \[Readonly\<GlobalConfig>]

The global config associated with this jest instance. It is `readonly`, so it cannot be changed in-place. In order to change it, you will need to create a new object.

Example:

```js
jest.globalConfig = {
  ...jest.globalConfig,
  collectCoverage: false,
  watch: false,
};
```

### `jest.projectConfigs` \[Readonly\<ProjectConfig>\[]]

A list of project configurations associated with this jest instance. They are `readonly`, so it cannot be changed in-place. In order to change it, you will need to create a new object.

```js
jest.projectConfigs = jest.projectConfigs.map(config => ({
  ...config,
  setupFiles: ['custom-setup.js', ...config.setupFiles],
}));
```

### `jest.run` \[function]

Async function that performs the run. It returns a promise that resolves in a `JestRunResult` object. This object has a `results` property that contains the actual results.

## Advanced use cases

These are more advanced use cases that demonstrate the power of the api.

### Overriding config options

You can use `createJest` to create a Jest instance, and alter some of the options using `globalConfig` adn `projectConfigs`.

```js
import {createJest} from 'jest';
const jest = await createJest();

// Override global options
jest.globalConfig = {
  ...jest.globalConfig,
  collectCoverage: false,
  reporters: [],
  testResultsProcessor: undefined,
  watch: false,
  testPathPattern: 'my-test.spec.js',
};

// Override project options
jest.projectConfigs = jest.projectConfigs.map(config => ({
  ...config,
  setupFiles: ['custom-setup.js', ...config.setupFiles],
}));

// Run
const {results} = await jest.run();
console.log(`run success, ${results.numPassedTests} passed tests.`);
```

### Override options based on the configured options

You might want to override options based on other options. For example, you might want to provide your own version of the `jsdom` or `node` test environment.

```js
import {createJest} from 'jest';

const jest = await createJest();

jest.projectConfigs = [
  {
    ...jest.projectConfigs[0],
    // Change the test environment based on the configured test environment
    testEnvironment: overrideTestEnvironment(configs[0].testEnvironment),
  },
];

const {results} = await jest.run();
console.log(results);
```
