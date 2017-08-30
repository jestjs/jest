---
id: getting-started
title: Getting Started
layout: docs
category: Introduction
permalink: docs/en/getting-started.html
next: using-matchers
---

Install Jest using `npm`:

```
npm install --save-dev jest
```

Or via [`yarn`](https://yarnpkg.com/en/package/jest):

```
yarn add --dev jest
```

Let's get started by writing a test for a hypothetical function that adds two numbers. First, create a `sum.js` file:

```javascript
function sum(a, b) {
  return a + b;
}
module.exports = sum;
```

Then, create a file named `sum.test.js`. This will contain our actual test:

```javascript
const sum = require('./sum');

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
```

Add the following section to your `package.json`:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

Finally, run `npm test` and Jest will print this message:

```
PASS  ./sum.test.js
✓ adds 1 + 2 to equal 3 (5ms)
```

**You just successfully wrote your first test using Jest!**

This test used `expect` and `toBe` to test that two values were exactly identical. To learn about the other things that Jest can test, see [Using Matchers](/jest/docs/using-matchers.html).

## Running from command line

You can run Jest directly from the CLI (if it's globally available in your `PATH`, e.g. by `npm install -g jest`) with variety of useful options.

Here's how to run Jest on files matching `my-test`, using `config.json` as a configuration file and display a native OS notification after the run:

```bash
jest my-test --notify --config=config.json
```

If you'd like to learn more about running `jest` through the command line, take a look at the [Jest CLI Options](https://facebook.github.io/jest/docs/cli.html) page.

## Additional Configuration

### Using Babel

To use [Babel](http://babeljs.io/), install the `babel-jest` and `regenerator-runtime` packages:

```
npm install --save-dev babel-jest regenerator-runtime
```

*Note: Explicitly installing `regenerator-runtime` is not needed if you use `npm` 3 or 4 or Yarn*

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file in your project's root folder. For example, if you are using ES6 and [React.js](https://facebook.github.io/react/) with the [`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and [`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```json
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES6 features and React specific syntax.

> Note: If you are using a more complicated Babel configuration, using Babel's `env` option,
keep in mind that Jest will automatically define `NODE_ENV` as `test`.
It will not use `development` section like Babel does by default when no `NODE_ENV` is set.

> Note: If you've turned off transpilation of ES2015 modules with the option `{ "modules": false }`, you have to make sure to turn this on in your test enviornment.
```json
{
  "presets": [["es2015", { "modules": false }], "react"],
  "env": {
    "test": {
      "presets": [["es2015"], "react"]
    }
  }
}
```

> Note: `babel-jest` is automatically installed when installing Jest and will automatically transform files if a babel configuration exists in your project. To avoid this behavior, you can explicitly reset the `transform` configuration option:

```json
// package.json
{
  "jest": {
    "transform": {}
  }
}
```

### Using webpack

Jest can be used in projects that use [webpack](https://webpack.github.io/) to manage assets, styles, and compilation. webpack does offer some unique challenges over other tools. Refer to the [webpack guide](/jest/docs/webpack.html) to get started.

### Using TypeScript

To use TypeScript in your tests, check [ts-jest](https://github.com/kulshekhar/ts-jest).
