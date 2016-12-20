---
id: getting-started
title: Getting Started
layout: docs
category: Introduction
permalink: docs/getting-started.html
next: mocking
---

Install Jest using `npm`:

```
npm install --save-dev jest
```

Let's get started by writing a test for a hypothetical function that adds two numbers. First, create a `sum.js` file:

```javascript
module.exports = (a, b) => a + b;
```

Then, create a file named `sum.test.js`. This will contain our actual test:

```javascript
test('adds 1 + 2 to equal 3', () => {
  const sum = require('./sum');
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

You are now ready to use Jest in your project. There's more to Jest, of course. To write tests for code with dependencies whose implementation does not need to be tested, you'll need to [learn about mocking](/jest/docs/mocking.html).
