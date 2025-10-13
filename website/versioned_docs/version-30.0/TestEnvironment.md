---
id: test-environment
title: Test Environment
---

Jest provides environment option to run code inside a specific environment. You can modify how environment behaves with `testEnvironmentOptions` option.

By default, you can use these environments:

- `node` is default environment
- `jsdom` emulates browser environment by providing Browser API, uses [`jsdom`](https://github.com/jsdom/jsdom) package

## Environments for Specific Files

When setting `testEnvironment` option in your config, it will apply to all the test files in your project. To have more fine-grained control, you can use control comments to specify environment for specific files. Control comments are comments that start with `@jest-environment` and are followed by the environment name:

- With built-in environments:

```js tab title="my-test.spec.js"
/**
 * @jest-environment jsdom
 */

test('use jsdom in this test file', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
```

```ts tab title="my-test.spec.ts"
/**
 * @jest-environment jsdom
 */

test('use jsdom in this test file', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
```

- With custom environment:

```js tab title="my-test.spec.js"
/**
 * @jest-environment ./my-custom-environment.js
 */

test('use jsdom in this test file', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
```

```ts tab title="my-test.spec.ts"
/**
 * @jest-environment ./my-custom-environment.ts
 */

test('use jsdom in this test file', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
```

### Extending built-in Environments

Jest allows you to extend the built-in environments, such as `NodeEnvironment` or `JSDOMEnvironment`, to create your own custom environment. This is useful when you want to add additional functionality or modify the behavior of the existing environments.

Here is an example of how to extend the `NodeEnvironment`:

```js tab title="custom-node-environment.js"
// An example of a custom Node environment

const NodeEnvironment = require('jest-environment-node');

/**
 * @implements {import('jest-environment-node').NodeEnvironment}
 */
class CustomNodeEnvironment extends NodeEnvironment {
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

```ts tab title="custom-node-environment.ts"
// An example of a custom Node environment

import NodeEnvironment from 'jest-environment-node';

export default class CustomNodeEnvironment extends NodeEnvironment {
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
```

and declare in your Jest config

```js tab title="jest.config.js"
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: './custom-node-environment.js',
};
```

```ts tab title="jest.config.ts"
import type {Config} from 'jest';

const config: Config = {
  testEnvironment: './custom-node-environment.ts',
};

export default config;
```

:::tip

Jest also provides `@jest/environment-jsdom-abstract` package to make it easier for you to compose your own custom test environment based on `jsdom` or use your own `jsdom` installed version.

```js tab title="custom-jsdom-environment.js"
const JSDOMEnvironment = require('@jest/environment-jsdom-abstract');
const jsdom = require('jsdom');

class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context, jsdom);
  }

  // Override methods to customize behavior
}

module.exports = CustomJSDOMEnvironment;
```

```ts tab title="custom-jsdom-environment.ts"
import JSDOMEnvironment from '@jest/environment-jsdom-abstract';
import jsdom from 'jsdom';

export default class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context, jsdom);
  }

  // Override methods to customize behavior
}
```

and declare in your Jest config

```js tab title="jest.config.js"
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: './custom-jsdom-environment.js',
};
```

```ts tab title="jest.config.ts"
import type {Config} from 'jest';

const config: Config = {
  testEnvironment: './custom-jsdom-environment.ts',
};

export default config;
```

:::

### Custom Environment

You can create your own package to extend Jest environment. To do so, create package with a name, or specify a path to a valid JS/TS file. That package should export an object with the shape of Environment:

:::tip

It's a best practice to name your custom environment with `jest-environment-` prefix, so that it is clearly identifiable as a Jest environment.

:::

```js tab title="environment.js"
/**
 * @implements {import('@jest/environment').JestEnvironment}
 */
class CustomEnvironment {
  // Implement the required methods here

  // Example of a method
  getVmContext() {
    return null;
  }
}

module.exports = CustomEnvironment;
```

```ts tab title="environment.ts"
import type {JestEnvironment} from '@jest/environment';

export default class CustomEnvironment implements JestEnvironment {
  // Implement the required methods here

  // Example of a method
  getVmContext() {
    return null;
  }
}
```

and declare in your Jest config

```js tab title="jest.config.js"
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: './environment.js',
};
```

```ts tab title="jest.config.ts"
import type {Config} from 'jest';

const config: Config = {
  testEnvironment: './environment.ts',
};

export default config;
```

## See Also

- [Configuration - testEnvironment](Configuration.md#testenvironment-string)
- [Configuration - testEnvironmentOptions](Configuration.md#testenvironmentoptions-object)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
