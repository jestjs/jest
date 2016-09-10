---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: tutorial-react
---

Install Jest with `npm` by running:

```
npm install --save-dev jest
```

Great! Now let's get started by writing a test for a hypothetical `sum.js` file:

```javascript
function sum(a, b) {
  return a + b;
}
module.exports = sum;
```

Create a directory `__tests__/` with a file `sum-test.js` or name it `sum.test.js` or `sum.spec.js` and put it anywhere in your project:

```javascript
test('adds 1 + 2 to equal 3', () => {
  const sum = require('../sum');
  expect(sum(1, 2)).toBe(3);
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
PASS __tests__/sum-test.js
```

Please read the [API documentation](/jest/docs/api.html) to learn about all available assertions, ways of writing tests, configuration options and Jest specific APIs. There is also a great introductory guide available at [Plotly Academy](https://academy.plot.ly/react/6-testing) that walks you through testing a react and redux application.

The code for this example is available at [examples/getting_started](https://github.com/facebook/jest/tree/master/examples/getting_started).

The [React](https://github.com/facebook/react/tree/master/src/renderers/shared/stack/reconciler/__tests__), [Relay](https://github.com/facebook/relay/tree/master/src/container/__tests__) and [react-native](https://github.com/facebook/react-native/tree/master/Libraries/Animated/src/__tests__) repositories have excellent examples of tests written by Facebook engineers.

**And you are ready to use Jest!**

### Babel Integration

If you'd like to use [Babel](http://babeljs.io/), it can easily be enabled:

```
npm install --save-dev babel-jest babel-polyfill
```

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file in your project's root folder. For example, if you are using ES2015 and [React.js](https://facebook.github.io/react/) with the [`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and [`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```js
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES2015 features and React specific syntax.

If you are using a more complicated Babel configuration, using Babel's `env` option,
keep in mind that Jest will automatically define `NODE_ENV` as `test`.
It will not use `development` section like Babel does by default when no `NODE_ENV` is set.

### React, React-Native and Snapshot Testing

Check out the [React tutorial](/jest/docs/tutorial-react.html) and the [React-Native tutorial](/jest/docs/tutorial-react-native.html) to get started with React or React-Native codebases.

We recommend using React's test renderer (`npm install --save-dev react-test-renderer`) to capture snapshots with Jest's snapshot feature. Write a test using `toMatchSnapshot`:

```js
import renderer from 'react-test-renderer';
it('renders correctly', () => {
  const tree = renderer.create(
    <Link page="http://www.facebook.com">Facebook</Link>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

and it will produce a snapshot like this:

```js
exports[`Link renders correctly 1`] = `
<a
  className="normal"
  href="http://www.facebook.com"
  onMouseEnter={[Function bound _onMouseEnter]}
  onMouseLeave={[Function bound _onMouseLeave]}>
  Facebook
</a>
`;
```

On subsequent test runs, Jest will compare the stored snapshot with the rendered output and highlight differences. If there are differences, Jest will ask you to fix your mistake and can be re-run with `jest -u` to update an outdated snapshot.

### Advanced Features

#### Use the interactive watch mode to automatically re-run tests

```
npm test -- --watch
// or
jest --watch
```

#### Install Jest globally

Jest can be installed globally: `npm install -g jest` which will make a global `jest` command available that can be invoked from anywhere within your project.

#### Async testing

Promises and even async/await can be tested easily.

Assume a `user.getUserName` function that returns a promise, now consider this async test with Babel and [`babel-plugin-transform-async-to-generator`](http://babeljs.io/docs/plugins/transform-async-to-generator/) or [`babel-preset-stage-3`](http://babeljs.io/docs/plugins/preset-stage-3/):

```js
import * as user from '../user';

// The promise that is being tested should be returned.
it('works with promises', () => {
  return user.getUserName(5)
    .then(name => expect(name).toEqual('Paul'));
});

it('works with async/await', async () => {
  const userName = await user.getUserName(4);
  expect(userName).toEqual('Mark');
});
```

Check out the [Async tutorial](/jest/docs/tutorial-async.html) for more.

#### Only run test files related to changes with `jest -o`

On large projects and applications it is often not feasible to run thousands of tests when a single file changes. Jest uses static analysis to look up dependency trees in reverse starting from changed JavaScript files only. During development, it is recommended to use `jest -o` or `jest --onlyChanged` which will find tests related to changed JavaScript files and only run relevant tests.

#### Mocking and Sandboxing

Jest isolates test files into their own environment and isolates module execution between test runs. Jest swaps out `require()` and can inject mocks that were either [created manually](/jest/docs/manual-mocks.html) by the user or automatically mocked through explicit calls to `jest.mock('moduleName')`.

#### Use `--bail` to abort after the first failed test.

If you don't want to wait until a full test run completes `--bail` can be used to abort the test run after the first error.

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

Jest can be integrated into Continuous Integration test runs and wrapped with other scripts to further analyze test results.

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
