---
id: version-23.0-watch-plugins
title: Watch Plugins
original_id: watch-plugins
---

The Jest watch plugin system provides a way to hook into specific parts of Jest and to define watch mode menu prompts that execute code on key press. Combined, these features allow you to develop interactive experiences custom for your workflow.

## Watch Plugin Interface

```javascript
class MyWatchPlugin {
  // Add hooks to Jest lifecycle events
  apply(jestHooks) {}

  // Get the prompt information for interactive plugins
  getUsageInfo(globalConfig) {}

  // Executed when the key from `getUsageInfo` is input
  run(globalConfig, updateConfigAndRun) {}
}
```

## Hooking into Jest

To connect your watch plugin to Jest, add its path under `watchPlugins` in your Jest configuration:

```javascript
// jest.config.js
module.exports = {
  // ...
  watchPlugins: ['path/to/yourWatchPlugin'],
};
```

Custom watch plugins can add hooks to Jest events. These hooks can be added either with or without having an interactive key in the watch mode menu.

### `apply(jestHooks)`

Jest hooks can be attached by implementing the `apply` method. This method receives a `jestHooks` argument that allows the plugin to hook into specific parts of the lifecycle of a test run.

```javascript
class MyWatchPlugin {
  apply(jestHooks) {}
}
```

Below are the hooks available in Jest.

#### `jestHooks.shouldRunTestSuite({ config, duration, testPath })`

Returns a boolean (or `Promise<boolean>`) for handling asynchronous operations) to specify if a test should be run or not.

For example:

```javascript
class MyWatchPlugin {
  apply(jestHooks) {
    jestHooks.shouldRunTestSuite(({testPath}) => {
      return testPath.includes('my-keyword');
    });

    // or a promise
    jestHooks.shouldRunTestSuite(({testPath}) => {
      return Promise.resolve(testPath.includes('my-keyword'));
    });
  }
}
```

#### `jestHooks.onTestRunComplete(results)`

Gets called at the end of every test run. It has the test results as an argument.

For example:

```javascript
class MyWatchPlugin {
  apply(jestHooks) {
    jestHooks.onTestRunComplete(results => {
      this._hasSnapshotFailure = results.snapshot.failure;
    });
  }
}
```

#### `jestHooks.onFileChange({projects})`

Gets called whenever there is a change in the file system

- `projects: Array<config: ProjectConfig, testPaths: Array<string>`: Includes all the test paths that Jest is watching.

For example:

```javascript
class MyWatchPlugin {
  apply(jestHooks) {
    jestHooks.onFileChange(({projects}) => {
      this._projects = projects;
    });
  }
}
```

## Watch Menu Integration

Custom watch plugins can also add or override functionality to the watch menu by specifying a key/prompt pair in `getUsageInfo` method and a `run` method for the execution of the key.

### `getUsageInfo(globalConfig)`

To add a key to the watch menu, implement the `getUsageInfo` method, returning a key and the prompt:

```javascript
class MyWatchPlugin {
  getUsageInfo(globalConfig) {
    return {
      key: 's',
      prompt: 'do something',
    };
  }
}
```

This will add a line in the watch mode menu _(`› Press s to do something.`)_

```text
Watch Usage
 › Press p to filter by a filename regex pattern.
 › Press t to filter by a test name regex pattern.
 › Press q to quit watch mode.
 › Press s to do something. // <-- This is our plugin
 › Press Enter to trigger a test run.
```

**Note**: If the key for your plugin already exists as a default key, your plugin will override that key.

### `run(globalConfig, updateConfigAndRun)`

To handle key press events from the key returned by `getUsageInfo`, you can implement the `run` method. This method returns a `Promise<boolean>` that can be resolved when the plugin wants to return control to Jest. The `boolean` specifies if Jest should rerun the tests after it gets the control back.

- `globalConfig`: A representation of Jest's current global configuration
- `updateConfigAndRun`: Allows you to trigger a test run while the interactive plugin is running.

```javascript
class MyWatchPlugin {
  run(globalConfig, updateConfigAndRun) {
    // do something.
  }
}
```
