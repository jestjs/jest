---
id: version-22.4-watch-plugins
title: Watch Plugins
original_id: watch-plugins
---

A watch plugin allows you to enhance Jest in a couple of ways. It provides you with ways of hooking into specific parts of Jest. It allows you to handle user input and provide an interactive experience

## JestHooks

Jest hooks can be accessed by implementing the `apply` method in a plugin
class. This receives a `jestHooks` argument that allows the plugin to hook into
specific parts of the lifecycle of a test run.

```javascript
class MyPlugin {
  apply(jestHooks) {}
}
```

### `jestHooks.shouldRunTestSuite(testPath)`

It returns a boolean to specify if a test should be run or not. It can return a
`Promise<boolean>` for handling asynchronous operations.

For example:

```javascript
class MyPlugin {
  apply(jestHooks) {
    jestHooks.shouldRunTestSuite(testPath => {
      return testPath.includes('my-keyword');
    });

    // or a promise

    jestHooks.shouldRunTestSuite(testPath => {
      return Promise.resolve(testPath.includes('my-keyword'));
    });
  }
}
```

### `jestHooks.testRunComplete(results)`

Gets called at the end of every test run. It has the test results as an
argument.

For example:

```javascript
class MyPlugin {
  apply(jestHooks) {
    jestHooks.testRunComplete(results => {
      this._hasSnapshotFailure = results.snapshot.failure;
    });
  }
}
```

### `jestHooks.fsChange({ projects })`

Gets called whenever there is a change in the file system. testPaths:

* `projects: Array<config: ProjectConfig, testPaths: Array<string>`: Includes
  all the test paths that Jest is watching.

For example:

```javascript
class MyPlugin {
  apply(jestHooks) {
    jestHooks.fsChange(({projects}) => {
      this._projects = projects;
    });
  }
}
```

## Interactive Plugins

### Showing the plugin on the watch usage menu.

Interactive plugins allow you to add functionality to the watch usage menu.

```javascript
class MyPlugin {
  getUsageInfo(globalConfig) {
    return {
      key: 's'.codePointAt(0),
      prompt: 'do something',
    };
  }
}
```

Adding `getUsageInfo` to a plugin adds a line in the watch mode menu
_(`› Press s to do something.`)_

```text
Watch Usage
 › Press p to filter by a filename regex pattern.
 › Press t to filter by a test name regex pattern.
 › Press q to quit watch mode.
 › Press s to do something. // <-- This is our plugin
 › Press Enter to trigger a test run.
```

### Running the plugin when the user interacts with it.

Given the example above, the plugin will run when the user presses `'s'`. For
that we can add a `run` method.

`run(globalConfig, updateConfigAndRun)`:
  - Returns a `Promise<boolean>` that can be resolved when the plugin wants to return control to Jest. The `boolean` specifies if Jest should rerun the tests after it gets the control back.
  - `globalConfig`: A representation of Jest's current global configuration
  - `updateConfigAndRun`: Allows you to trigger a test run while the interactive plugin is running.

```javascript
class MyPlugin {
  run(globalConfig, updateConfigAndRun) {
    // do something.
  }
}
```
