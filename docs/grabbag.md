---
id: grabbag
title: grabbag
layout: docs
permalink: docs/grabbag.html
---

## Grab bag

This is a temporary document that will not ship in the updated website. Use it to temporarily save any snippets that have been removed from existing docs but that may still be useful to use somewhere.

### Using the REPL

Before you install Jest, you can try out a real version of Jest through [repl.it](https://repl.it). Just edit your test and hit the run button!
<iframe class="jest-repl" src="https://repl.it/languages/jest?lite=true"></iframe>

### Video

**...or watch a video to get started with Jest:**
<div class="video">
  <iframe src="https://fast.wistia.net/embed/iframe/78j73pyz17"></iframe>
</div>
<div class="video-shoutout">
  <a href="https://egghead.io/lessons/javascript-test-javascript-with-jest">Video</a> by <a href="https://twitter.com/kentcdodds">Kent C. Dodds</a> hosted by <a href="https://egghead.io">Egghead</a>.
</div>


### Supported file names

As you've learned, Jest will run tests in files that follow the "test.js" naming convention.

Create a directory `__tests__/` with a file named `sum-test.js`:

You don't have to place your tests in a `__tests__/` folder, however.

If you prefer, you can name your file `sum.test.js` or `sum.spec.js` and put it anywhere in your project. Jest will automatically pick up and run tests on any files that follow this naming convention.

### Plotly

Introductory guide at Plotly Academy that walks you through testing a React and Redux application: http://academy.plot.ly/react/6-testing/

### Babel Integration

If you'd like to use [Babel](http://babeljs.io/), it can easily be enabled: `yarn add -D babel-jest babel-polyfill`.

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file in your project's root folder. For example, if you are using ES2015 and [React.js](https://facebook.github.io/react/) with the [`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and [`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```js
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES6 features and React specific syntax.

*Note: If you are using a more complicated Babel configuration, using Babel's `env` option,
keep in mind that Jest will automatically define `NODE_ENV` as `test`.
It will not use `development` section like Babel does by default when no `NODE_ENV` is set.*

### React, React Native and Snapshot Testing

Check out the [React tutorial](/jest/docs/tutorial-react.html) and the [React Native tutorial](/jest/docs/tutorial-react-native.html) to get started with React or React Native codebases. You can use React's test renderer (`yarn add -D react-test-renderer`) to capture snapshots with Jest's snapshot feature and the `toMatchSnapshot` matcher:

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
