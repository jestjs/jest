---
id: getting-started
title: Getting Started
layout: docs
category: Introduction
permalink: docs/getting-started.html
next: using-matchers
---

Install Jest using `npm`:

```
npm install --save-dev jest
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

> Note: `babel-jest` is installed when `jest or jest-cli` installed. If `.babelrc or .babelrc.js or babel(package.json)` exists in your project's folder,
files are transformed without any explicit `babel-jest` installation. To avoid this behavior, include explicit `transform` jest configuration
```json
// package.json
// if you don't have any transformations required for other files
{
  "jest": {
    "transform": {}
  }
}
```
```json
// If you have custom transformations defined for other extensions
{
  "jest": {
    "transform": {
      "^.+\\.js$": "<rootDir>/preprocessor.js",
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/fileTransformer.js"
    }
  }
}
```
```javascript
// preprocessor.js
module.exports = {
  process(src) {
      return src; // we are just returning source without any transformation
  },
};
```

### Using webpack

Jest can be used in projects that use [webpack](https://webpack.github.io/) to manage assets, styles, and compilation. webpack does offer some unique challenges over other tools. Refer to the [webpack guide](/jest/docs/webpack.html) to get started.

### Using TypeScript

To use TypeScript in your tests, install the `ts-jest` package and the types for Jest.

```
npm install --save-dev ts-jest @types/jest
```

then modify your `package.json` so the `jest` section looks something like:

```json
{
  "jest": {
    "transform": {
      ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js",
      "json"
    ]
  }
}
```
