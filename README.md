# [Jest](http://facebook.github.io/jest/) [![Build Status](https://travis-ci.org/facebook/jest.svg?branch=master)](https://travis-ci.org/facebook/jest) [![Windows Build Status](https://ci.appveyor.com/api/projects/status/8n38o44k585hhvhd/branch/master?svg=true)](https://ci.appveyor.com/project/Daniel15/jest/branch/master) [![npm version](https://badge.fury.io/js/jest-cli.svg)](http://badge.fury.io/js/jest-cli)


Painless JavaScript Testing

- **Adaptable**: Jest uses Jasmine assertions by default and Jest is modular, extendible and configurable.

- **Sandboxed and Fast**: Jest virtualizes JavaScript environments, provides browser mocks and runs tests in parallel across workers.

- **Snapshot Testing**: Jest can [capture snapshots](http://facebook.github.io/jest/docs/tutorial-react.html#snapshot-testing) of React trees or other serializable values to write tests quickly and it provides a seamless update experience.

## Getting Started

<generated_getting_started_start />
Before you install Jest, you can try out a real version of Jest through [repl.it](https://repl.it). Just edit your test and hit the run button!
<iframe class="jest-repl" src="https://repl.it/languages/jest?lite=true"></iframe>

Install Jest with `yarn` or `npm` by running `yarn add jest -D` or `npm install --save-dev jest`. Let's get started by writing a test for a hypothetical `sum.js` file:

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

Run `yarn test` and Jest will print this message: `PASS __tests__/sum-test.js`. You just successfully wrote your first test using Jest!

**You are ready to use Jest! Here are some more resources to help you get started:**

* Read the [API Documentation](https://facebook.github.io/jest/docs/api.html) to learn about all available assertions, ways of writing tests and Jest specific APIs.
* [Jest Configuration](https://facebook.github.io/jest/docs/configuration.html).
* [Example Code](https://github.com/facebook/jest/tree/master/examples/getting_started).
* [Migration from other test runners](https://facebook.github.io/jest/docs/migration-guide.html).
* Introductory guide at [Plotly Academy](https://academy.plot.ly/react/6-testing) that walks you through testing a React and Redux application.
* The [React](https://github.com/facebook/react/tree/master/src/renderers/shared/stack/reconciler/__tests__), [Relay](https://github.com/facebook/relay/tree/master/src/container/__tests__) and [react-native](https://github.com/facebook/react-native/tree/master/Libraries/Animated/src/__tests__) repositories have excellent examples of tests written by Facebook engineers.

**...or watch a video to get started with Jest:**
<div class="video">
  <iframe src="https://fast.wistia.net/embed/iframe/78j73pyz17"></iframe>
</div>
<div class="video-shoutout">
  <a href="https://egghead.io/lessons/javascript-test-javascript-with-jest">Video</a> by <a href="https://twitter.com/kentcdodds">Kent C. Dodds</a> hosted by <a href="https://egghead.io">Egghead</a>.
</div>

### Babel Integration

If you'd like to use [Babel](http://babeljs.io/), it can easily be enabled: `yarn add -D babel-jest babel-polyfill`.

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

Check out the [React tutorial](https://facebook.github.io/jest/docs/tutorial-react.html) and the [React Native tutorial](https://facebook.github.io/jest/docs/tutorial-react-native.html) to get started with React or React Native codebases. You can use React's test renderer (`yarn add react-test-renderer -D`) to capture snapshots with Jest's snapshot feature and the `toMatchSnapshot` matcher:

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
<generated_getting_started_end />

## API & Configuration

* [API Reference](http://facebook.github.io/jest/docs/api.html)
* [Configuration](http://facebook.github.io/jest/docs/configuration.html)
