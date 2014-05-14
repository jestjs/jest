---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: tutorial
---

Consider a scenario where you want to test the following `sum.js` file:

```javascript
// sum.js
function sum(value1, value2) {
  return value1 + value2;
}
module.exports = sum;
```

We can get up and running with the following 4 steps:

1. Create a directory `__tests__/` with a file `sum-test.js`

  ```javascript
  // __tests__/sum-test.js
  jest.dontMock('../sum');

  describe('sum', function() {
    it('adds 1 + 2 to equal 3', function() {
      var sum = require('../sum');
      expect(sum(1, 2)).toBe(3);
    });
  });
  ```

2. Run `npm install jest-cli --save-dev`

3. Add the following to your `package.json`

  ```js
  {
    ...
    "scripts": {
      "test": "jest"
    }
    ...
  }
  ```

4. Run `npm test`

  ```
  [PASS] __tests__/sum-test.js (0.015s)
  ```
