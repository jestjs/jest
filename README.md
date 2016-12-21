# [Jest](http://facebook.github.io/jest/) [![Build Status](https://travis-ci.org/facebook/jest.svg?branch=master)](https://travis-ci.org/facebook/jest) [![Windows Build Status](https://ci.appveyor.com/api/projects/status/8n38o44k585hhvhd/branch/master?svg=true)](https://ci.appveyor.com/project/Daniel15/jest/branch/master) [![npm version](https://badge.fury.io/js/jest-cli.svg)](http://badge.fury.io/js/jest-cli)


Painless JavaScript Testing

- **Adaptable**: Jest uses Jasmine assertions by default and Jest is modular, extendible and configurable.

- **Sandboxed and Fast**: Jest virtualizes JavaScript environments, provides browser mocks and runs tests in parallel across workers.

- **Snapshot Testing**: Jest can [capture snapshots](http://facebook.github.io/jest/docs/tutorial-react.html#snapshot-testing) of React trees or other serializable values to write tests quickly and it provides a seamless update experience.

## Getting Started

<generated_getting_started_start />
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

```js
"scripts": {
  "test": "jest"
}
```

Finally, run `npm test`. Jest will print this message:

```
PASS  ./sum.test.js
✓ adds 1 + 2 to equal 3 (5ms)
```

You just successfully wrote your first test using Jest!

This test used `expect` and `toBe` to test that two values were exactly identical. To learn about the other things that Jest can test, see [Using Matchers](https://facebook.github.io/jest/docs/mocking.html).
<generated_getting_started_end />

## API & Configuration

* [API Reference](http://facebook.github.io/jest/docs/api.html)
* [Configuration](http://facebook.github.io/jest/docs/configuration.html)
