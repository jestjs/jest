---
id: troubleshooting
title: Troubleshooting
layout: docs
category: Reference
permalink: docs/troubleshooting.html
next: mock-functions
---

Uh oh, something went wrong? Use this guide to resolve issues with Jest.

### An npm package isn't properly being mocked.

Consider using `jest.unmock('moduleName')` or add the path to the node module
to the [unmockedModulePathPatterns](/jest/docs/api.html#config-unmockedmodulepathpatterns-array-string)
config option.

You can also provide a [manual mock](/jest/docs/manual-mocks.html) by creating
a `moduleName.js` file in a `__mocks__` folder in the root level of your
project.

### Caching Issues

The preprocessor script was changed or babel was updated and the changes aren't
being recognized by Jest?

Retry with `--no-cache`.

Explanation: Jest caches transformed module files to speed up test execution.
If you are using your own custom preprocessor, consider adding a `getCacheKey`
function to it: [getCacheKey in Relay](https://github.com/facebook/relay/blob/master/scripts/jest/preprocessor.js#L63-L67).

### Unresolved Promises

If a promise doesn't resolve at all, this error might be thrown:

```
- Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.`
```

Most commonly this is being caused by conflicting Promise implementations.
Consider replacing the global promise implementation with your own, for example
`global.Promise = require.requireActual('promise');` and/or consolidate the
used Promise libraries to a single one.

If your test is long running, you may want to consider to increase the timeout
specified in `jasmine.DEFAULT_TIMEOUT_INTERVAL`.

```
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; // 10 second timeout
```

### Watchman Issues

Try running Jest with `--no-watchman` or set the `watchman` configuration option
to `false`.

Also see [watchman troubleshooting](https://facebook.github.io/watchman/docs/troubleshooting.html).

### I'm using npm3 and my node_modules aren't properly loading.

Upgrade `jest-cli` to `0.9.0`.

### I'm using babel and my unmocked imports aren't working?

Upgrade `jest-cli` to `0.9.0`.

Explanation:

```js
jest.dontMock('foo');

import foo from './foo';
```

In ES2015, import statements get hoisted before all other

```js
var foo = require('foo');
jest.dontMock('foo'); // Oops!
```

In Jest 0.9.0, a new API `jest.unmock` was introduced. Together with a plugin
for babel, this will now work properly when using `babel-jest`:

```js
jest.unmock('foo'); // Use unmock!

import foo from './foo';

// foo is not mocked!
```

See the [Getting Started](/jest/docs/getting-started.html) guide on how to
enable babel support.

### I upgraded to Jest 0.9.0 and my tests are now failing?

Jest is now using Jasmine 2 by default. It should be easy to upgrade using the
Jasmine [upgrade guide](http://jasmine.github.io/2.0/introduction.html).

If you would like to continue using Jasmine 1, set the `testRunner` config
option to `jasmine1` or pass `--testRunner=jasmine1` as a command line option.

### Compatibility issues

Jest takes advantage of new features added to Node 4. We recommend that you
upgrade to the latest stable release of Node. The minimum supported version is
`v4.0.0`. Versions `0.x.x` are not supported.

### Still unresolved?

See [Support](/jest/support.html).
