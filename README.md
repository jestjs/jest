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

Let's get started by writing a test for a hypothetical `sum.js` file:

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


### grab bag

Before you install Jest, you can try out a real version of Jest through [repl.it](https://repl.it). Just edit your test and hit the run button!
<iframe class="jest-repl" src="https://repl.it/languages/jest?lite=true"></iframe>
<generated_getting_started_end />

## API & Configuration

* [API Reference](http://facebook.github.io/jest/docs/api.html)
* [Configuration](http://facebook.github.io/jest/docs/configuration.html)
