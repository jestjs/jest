---
id: snapshot-testing
title: Snapshot Testing
layout: docs
category: Guides
permalink: docs/snapshot-testing.html
next: tutorial-react
---

### Editor's Note

To use Snapshot Testing, you have to already make the decision to use Jest. Therefore, this document belongs under "Guides".

This guide will serve as a comprehensive "what is snapshot testing and how to use it". While snapshot testing is already covered in the React and React Native tutorials, those tutorials are focused on setting up Jest in React and React Native and are not well suited to go in depth into Snapshot Testing without overpowering the rest of the content.

One issue that comes up when writing a dedicated Snapshot Testing guide is that we still need the user to go through the process of setting up Jest on their React or React Native project.

Proposal:

* Introduce Snapshot Testing

While Snapshot Testing can be used to test any serializable output, it was designed to test React components.


Issues: the setup instructions for React and React Native vary, and may well require keeping these two separate. This could be either separate guides that are limited to setting up Jest on React or React Native


## WIP Intro

Jest can capture snapshots of React trees or other serializable values to simplify UI testing. (Some additional introduction on what snapshot testing is and why snapshot testing is useful.)

More information on how it works and why we built it can be found on the [release blog post](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html).


## Snapshot Testing in React and React Native

You can use React's test renderer to capture snapshots with Jest's snapshot feature and the `toMatchSnapshot` matcher:

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

...this should be fleshed out more...

Check out the [React tutorial](/jest/docs/tutorial-react.html) and the [React Native tutorial](/jest/docs/tutorial-react-native.html) to get started with React or React Native codebases.

...these two tutorials have the same content but slightly adjusted to cover differences in the frameworks...

## Additional Uses

...is there something else we can use snapshot testing for?


##### OLDER content


## Testing React Apps

If you are just getting started with React, we recommend using [create-react-app](https://github.com/facebookincubator/create-react-app). It is ready to use and [ships with Jest](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#running-tests)!

### Setup

If you have an existing application and you did not use `create-react-app`, you'll need to install a few packages to make everything work well together. We are using the `babel-jest` package and the `react` babel preset to transform our code inside of the test environment. Also see [babel integration](/jest/docs/getting-started.html#babel-integration).

Install all dependencies by running

```javascript
npm install --save-dev jest babel-jest babel-preset-es2015 babel-preset-react react-test-renderer
```

Open your `package.json` and add a jest test command to your "scripts" section:

```javascript
// package.json
  "dependencies": {
    "react": "<current-version>",
    "react-dom": "<current-version>"
  },
  "devDependencies": {
    "babel-jest": "<current-version>",
    "babel-preset-es2015": "<current-version>",
    "babel-preset-react": "<current-version>",
    "jest": "<current-version>",
    "react-test-renderer": "<current-version>"
  },
  "scripts": {
    "test": "jest"
  }
```

...then configure Babel to use the following presets by editing your `.babelrc` file:

```javascript
// .babelrc
{
  "presets": ["es2015", "react"]
}
```

**And you're good to go!**

## Testing React Native Apps

As of version 0.38, React Native apps created using the `react-native` CLI are already configured to use Jest by default.

```javascript
// package.json
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "react-native"
  }
```

*Note: If you are upgrading your react-native application and previously used the `jest-react-native` preset, remove the dependency from your `package.json` file and change the preset to `react-native` instead.*

Simply run `npm test` to run tests with Jest.
