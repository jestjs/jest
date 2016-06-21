---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: tutorial
---

First install Jest with npm by running:

```
npm install --save-dev jest-cli
```

Great! Now let's get started by writing a test for a hypothetical `sum.js` file:

```javascript
function sum(a, b) {
  return a + b;
}
module.exports = sum;
```

Create a directory `__tests__/` with a file `sum-test.js`:

```javascript
jest.unmock('../sum'); // unmock to use the actual implementation of sum

describe('sum', () => {
  it('adds 1 + 2 to equal 3', () => {
    const sum = require('../sum');
    expect(sum(1, 2)).toBe(3);
  });
});
```

Add the following to your `package.json`:

```js
"scripts": {
  "test": "jest"
}
```

Run `npm test`:

```
[PASS] __tests__/sum-test.js (0.010s)
```

The code for this example is available at
[examples/getting_started](https://github.com/facebook/jest/tree/master/examples/getting_started).

**And you are ready to enjoy working with Jest!**

### Babel Integration

If you'd like to use [Babel](http://babeljs.io/), it can easily be enabled:

```
npm install --save-dev babel-jest babel-polyfill
```

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file
in your project's root folder. For example, if you are using ES2015 and
[React.js](https://facebook.github.io/react/) with the
[`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and
[`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```js
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES2015 features and React specific syntax,
for example:

```js
jest.unmock('../CheckboxWithLabel');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import CheckboxWithLabel from '../CheckboxWithLabel';

describe('CheckboxWithLabel', () => {
  it('changes the text after click', () => {
    // Render a checkbox with label in the document
    const checkbox = TestUtils.renderIntoDocument(
      <CheckboxWithLabel labelOn="On" labelOff="Off" />
    );

    const checkboxNode = ReactDOM.findDOMNode(checkbox);

    // Verify that it's Off by default
    expect(checkboxNode.textContent).toEqual('Off');

    // ...
  });
});
```

Check out the [React tutorial](/jest/docs/tutorial-react.html) for more.

**And you are good to go!** The next time you run Jest it will print something
like

 ```
 Using Jest CLI v<version>, jasmine2, babel-jest
 ```

The
[React](https://github.com/facebook/react/tree/master/src/renderers/shared/stack/reconciler/__tests__),
[Relay](https://github.com/facebook/relay/tree/master/src/container/__tests__) and
[react-native](https://github.com/facebook/react-native/tree/master/Libraries/Animated/src/__tests__)
repositories have excellent examples of tests written by Facebook engineers.

### Advanced Features

#### Only run test files related to changes with `jest -o`

On large projects and applications it is often not feasible to run thousands of
tests when a single file changes. Jest uses static analysis to look up
dependency trees in reverse starting from changed JavaScript files only. During
development, it is recommended to use `jest -o` or `jest --onlyChanged` which
will find tests related to changed JavaScript files and only run relevant tests.

#### Install Jest globally

Jest can be installed globally: `npm install -g jest-cli` which will make a
global `jest` command available that can be invoked from anywhere within your
project.

#### Async testing

Promises and even async/await can be tested easily.

Assume a `user.getUserName` function that returns a promise, now consider this
async test with Babel and
[`babel-plugin-transform-async-to-generator`](http://babeljs.io/docs/plugins/transform-async-to-generator/) or
[`babel-preset-stage-3`](http://babeljs.io/docs/plugins/preset-stage-3/):

```js
jest.unmock('../user');

import * as user from '../user';

describe('async tests', () => {
  // The promise that is being tested should be returned.
  it('works with promises', () => {
    return user.getUserName(5)
      .then(name => expect(name).toEqual('Paul'));
  });

  it('works with async/await', async () => {
    const userName = await user.getUserName(4);
    expect(userName).toEqual('Mark');
  });
});
```

Check out the [Async tutorial](/jest/docs/tutorial-async.html) for more.

#### Automated Mocking and Sandboxing

Jest isolates test files into their own environment and isolates module
execution between test runs. Jest swaps out `require()` to inject mocks that
were either [created manually](/jest/docs/manual-mocks.html)
by the user or [automatic mocks](/jest/docs/automatic-mocking.html) through the
automocking feature.

#### Use the `--watch` option to automatically re-run tests

Jest can automatically re-run tests when files change:

```
jest --watch
```

#### Use `--bail` to abort after the first failed test.

If you don't want to wait until a full test run completes `--bail` can
be used to abort the test run after the first error.

#### Use `--coverage` to generate a code coverage report

Code coverage can be generated easily with `--coverage`.

```
-----------------------|----------|----------|----------|----------|
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |
-----------------------|----------|----------|----------|----------|
 react/                |     91.3 |    60.61 |      100 |      100 |
  CheckboxWithLabel.js |     91.3 |    60.61 |      100 |      100 |
-----------------------|----------|----------|----------|----------|
```

#### Use `--json` for CI integrations

Jest can be integrated into Continuous Integration test runs and wrapped with
other scripts to further analyze test results.

Example Output:

```js
{
  "success": true,
  "startTime": 1456983486661,
  "numTotalTests": 1,
  "numTotalTestSuites": 1,
  "numRuntimeErrorTestSuites": 0,
  "numPassedTests": 1,
  "numFailedTests": 0,
  "numPendingTests": 0,
  "testResults":[
    {
      "name": "react/__tests__/CheckboxWithLabel-test.js",
      "status": "passed",
      "startTime": 1456983488908,
      "endTime": 1456983493037
    }
  ]
}
```

#### Remote debugging with Web Inspector

Web Inspector can be used to debug both the application code and the testing
code. To set this up, first verify that you have both `node-inspector` and
`node-debug` installed.

```
which node-inspector
which node-debug
```

Install packages that you are missing.

```
npm install -g node-inspector node-debug
```

Run `node-debug` with the Jest binary as the target.

```
node-debug node_modules/jest-cli/bin/jest.js -i
```

You should see that Node Inspector has been started in the prompt.

```
Node Inspector
Visit http://127.0.0.1:8080/?port=5858 to start debugging.
Debugging `node_modules/jest-cli/bin/jest.js`

Debugger listening on port 5858
```

A new Chrome window should open and subsequently open a page to localhost on
port 5858. If this does not happen, you can go to the debugging URL directly
in a Chrome browser tab. The program should stop in the `jest.js` file in
the first line of code. Press the play button in the inspector window to
continue execution.

To stop the code at an arbitrary point, set a `debugger` expression in the
code where you would like the program to stop. Stop (`ctrl-c`) and restart
`node-debug` in the command line to catch at the debugger expression you
just added.
