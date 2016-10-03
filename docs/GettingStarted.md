---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: tutorial-react
---

Install Jest with `npm` by running `npm install --save-dev jest`. Let's get started by writing a test for a hypothetical `sum.js` file:

```javascript
module.exports = (a, b) => a + b;
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

Run `npm test` and Jest will print this message: `PASS __tests__/sum-test.js`. You just successfully wrote your first test using Jest!

**You are ready to use Jest! Here are some more resources to help you get started:**

* Read the [API Documentation](/jest/docs/api.html) to learn about all available assertions, ways of writing tests and Jest specific APIs.
* [Jest Configuration](/jest/docs/configuration.html).
* [Example Code](https://github.com/facebook/jest/tree/master/examples/getting_started).
* [Migration from other test runners](/jest/docs/migration-guide.html).
* Introductory guide at [Plotly Academy](https://academy.plot.ly/react/6-testing) that walks you through testing a React and Redux application.
* The [React](https://github.com/facebook/react/tree/master/src/renderers/shared/stack/reconciler/__tests__), [Relay](https://github.com/facebook/relay/tree/master/src/container/__tests__) and [react-native](https://github.com/facebook/react-native/tree/master/Libraries/Animated/src/__tests__) repositories have excellent examples of tests written by Facebook engineers.

### Babel Integration

If you'd like to use [Babel](http://babeljs.io/), it can easily be enabled: `npm install --save-dev babel-jest babel-polyfill`.

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file in your project's root folder. For example, if you are using ES2015 and [React.js](https://facebook.github.io/react/) with the [`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and [`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```js
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES2015 features and React specific syntax.

*Note: If you are using a more complicated Babel configuration, using Babel's `env` option,
keep in mind that Jest will automatically define `NODE_ENV` as `test`.
It will not use `development` section like Babel does by default when no `NODE_ENV` is set.*

### React, React Native and Snapshot Testing

Check out the [React tutorial](/jest/docs/tutorial-react.html) and the [React Native tutorial](/jest/docs/tutorial-react-native.html) to get started with React or React Native codebases. You can use React's test renderer (`npm install --save-dev react-test-renderer`) to capture snapshots with Jest's snapshot feature and the `toMatchSnapshot` matcher:

```js
import renderer from 'react-test-renderer';
test('Link renders correctly', () => {
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
  onMouseEnter={[Function]}
  onMouseLeave={[Function]}>
  Facebook
</a>
`;
```

On subsequent test runs, Jest will compare the stored snapshot with the rendered output and highlight differences. If there are differences, Jest will ask you to fix your mistake and can be re-run with `-u` or `--updateSnapshot` to update an outdated snapshot.
