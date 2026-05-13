---
id: troubleshooting
title: Troubleshooting
---

Uh oh, something went wrong? Use this guide to resolve issues with Jest.

## Tests are Failing and You Don't Know Why

Try using the [debugging support](https://nodejs.org/api/debugger.html) built into Node. Place a `debugger;` statement in any of your tests, and then, in your project's directory, run:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand [any other arguments here]
or on Windows
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand [any other arguments here]
```

This will run Jest in a Node process that an external debugger can connect to. Note that the process will pause until the debugger has connected to it.

You can then attach a debugger to the paused process. See the sections below for specific debugger instructions.

:::note

The `--runInBand` cli option makes sure Jest runs the test in the same process rather than spawning processes for individual tests. Normally Jest parallelizes test runs across processes but it is hard to debug many processes at the same time.

:::

## Debugging in Chrome

To debug your tests in Google Chrome (or any Chromium-based browser), follow these steps:

### Step 1: Add a debugger statement

Place a `debugger;` statement in your test file where you want execution to pause:

```javascript
describe('my test', () => {
  it('should work', () => {
    debugger; // Execution will pause here
    expect(true).toBe(true);
  });
});
```

### Step 2: Run Jest with the inspect flag

In your project's directory, run:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand [any other arguments here]
```

Or on Windows:

```bash
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand [any other arguments here]
```

You should see output like:

```
Debugger listening on ws://127.0.0.1:9229/...
For help, see: https://nodejs.org/en/docs/inspector
```

The process will pause and wait for a debugger to connect.

### Step 3: Open Chrome DevTools

1. Open Google Chrome (or any Chromium-based browser)
2. Navigate to `chrome://inspect`
3. You should see your Jest process listed under "Remote Target"
4. Click the "Inspect" link next to your Jest process

### Step 4: DevTools will open

When Chrome DevTools opens, you'll see:

- A breakpoint at the first line of the Jest CLI script (this gives you time to open DevTools)
- The debugger paused in the `Inspect` view

### Step 5: Resume execution

1. Look for the blue "Resume" button (looks like a play button ▶) in the top toolbar
2. Click it to continue execution
3. Jest will run and load your tests
4. When Jest reaches your `debugger;` statement, execution will pause again

### Step 6: Debug your code

Now you can:

- **Inspect variables**: Hover over variables or use the console
- **Step through code**: Use Step Over (F10), Step Into (F11), Step Out (Shift+F11)
- **Evaluate expressions**: Type expressions in the console tab
- **Set additional breakpoints**: Click line numbers in DevTools

### Troubleshooting

**Process doesn't appear in chrome://inspect?**

- Make sure you waited long enough after running the command
- Check that port 9229 isn't blocked by a firewall
- Try refreshing the `chrome://inspect` page

**Execution doesn't pause on `debugger;`?**

- Make sure you're using `--runInBand` flag
- Verify the `debugger;` statement is in your test file
- Check that the file will actually be executed

**Port 9229 already in use?**

- Change the port: `node --inspect-brk=9230 node_modules/.bin/jest --runInBand`
- Find and kill the process using port 9229

:::note

The `--runInBand` flag is important because it runs all tests in a single process. Without it, Jest spawns multiple processes for parallel test execution, making it difficult to debug since the debugger would need to attach to multiple processes.

:::

## Debugging in VS Code

There are multiple ways to debug Jest tests with [Visual Studio Code's](https://code.visualstudio.com) built-in [debugger](https://code.visualstudio.com/docs/nodejs/nodejs-debugging).

To attach the built-in debugger, run your tests as aforementioned:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand [any other arguments here]
or on Windows
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand [any other arguments here]
```

Then attach VS Code's debugger using the following `launch.json` config:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach",
      "port": 9229
    }
  ]
}
```

To automatically launch and attach to a process running your tests, use the following configuration:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeArgs": [
        "--inspect-brk",
        "${workspaceRoot}/node_modules/.bin/jest",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

or the following for Windows:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeArgs": [
        "--inspect-brk",
        "${workspaceRoot}/node_modules/jest/bin/jest.js",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

If you are using Facebook's [`create-react-app`](https://github.com/facebookincubator/create-react-app), you can debug your Jest tests with the following configuration:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CRA Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/react-scripts",
      "args": [
        "test",
        "--runInBand",
        "--no-cache",
        "--env=jsdom",
        "--watchAll=false"
      ],
      "cwd": "${workspaceRoot}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

More information on Node debugging can be found [here](https://nodejs.org/api/debugger.html).

## Debugging in WebStorm

[WebStorm](https://www.jetbrains.com/webstorm/) has built-in support for Jest. Read [Testing With Jest in WebStorm](https://blog.jetbrains.com/webstorm/2018/10/testing-with-jest-in-webstorm/) to learn more.

## Caching Issues

The transform script was changed or Babel was updated and the changes aren't being recognized by Jest?

Retry with [`--no-cache`](CLI.md#--cache). Jest caches transformed module files to speed up test execution. If you are using your own custom transformer, consider adding a `getCacheKey` function to it: [getCacheKey in Relay](https://github.com/facebook/relay/blob/58cf36c73769690f0bbf90562707eadb062b029d/scripts/jest/preprocessor.js#L56-L61).

## Unresolved Promises

If a promise doesn't resolve at all, this error might be thrown:

```bash
- Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.
```

Most commonly this is being caused by conflicting Promise implementations. Consider replacing the global promise implementation with your own, for example `globalThis.Promise = jest.requireActual('promise');` and/or consolidate the used Promise libraries to a single one.

If your test is long running, you may want to consider to increase the timeout by calling `jest.setTimeout`

```js
jest.setTimeout(10_000); // 10 second timeout
```

## Watchman Issues

Try running Jest with [`--no-watchman`](CLI.md#--watchman) or set the `watchman` configuration option to `false`.

Also see [watchman troubleshooting](https://facebook.github.io/watchman/docs/troubleshooting).

## Tests are Extremely Slow on Docker and/or Continuous Integration (CI) server.

While Jest is most of the time extremely fast on modern multi-core computers with fast SSDs, it may be slow on certain setups as our users [have](https://github.com/jestjs/jest/issues/1395) [discovered](https://github.com/jestjs/jest/issues/1524#issuecomment-260246008).

Based on the [findings](https://github.com/jestjs/jest/issues/1524#issuecomment-262366820), one way to mitigate this issue and improve the speed by up to 50% is to run tests sequentially.

In order to do this you can run tests in the same thread using [`--runInBand`](CLI.md#--runinband):

```bash npm2yarn
# Using Jest CLI
jest --runInBand

# Using your package manager's `test` script (e.g. with create-react-app)
npm test -- --runInBand
```

Another alternative to expediting test execution time on Continuous Integration Servers such as Travis-CI is to set the max worker pool to ~_4_. Specifically on Travis-CI, this can reduce test execution time in half. Note: The Travis CI _free_ plan available for open source projects only includes 2 CPU cores.

```bash npm2yarn
# Using Jest CLI
jest --maxWorkers=4

# Using your package manager's `test` script (e.g. with create-react-app)
npm test -- --maxWorkers=4
```

If you use GitHub Actions, you can use [`github-actions-cpu-cores`](https://github.com/SimenB/github-actions-cpu-cores) to detect number of CPUs, and pass that to Jest.

```yaml
- name: Get number of CPU cores
  id: cpu-cores
  uses: SimenB/github-actions-cpu-cores@v2
- name: run tests
  run: yarn jest --max-workers ${{ steps.cpu-cores.outputs.count }}
```

Another thing you can do is use the [`shard`](CLI.md#--shard) flag to parallelize the test run across multiple machines.

## `coveragePathIgnorePatterns` seems to not have any effect.

Make sure you are not using the `babel-plugin-istanbul` plugin. Jest wraps Istanbul, and therefore also tells Istanbul what files to instrument with coverage collection. When using `babel-plugin-istanbul`, every file that is processed by Babel will have coverage collection code, hence it is not being ignored by `coveragePathIgnorePatterns`.

## Defining Tests

Tests must be defined synchronously for Jest to be able to collect your tests.

As an example to show why this is the case, imagine we wrote a test like so:

```js
// Don't do this it will not work
setTimeout(() => {
  it('passes', () => expect(1).toBe(1));
}, 0);
```

When Jest runs your test to collect the `test`s it will not find any because we have set the definition to happen asynchronously on the next tick of the event loop. This means when you are using `test.each` you cannot set the table asynchronously within a `beforeEach` / `beforeAll`.

## Still unresolved?

See [Help](/help).
