---
id: tutorial-coffeescript
title: Tutorial - CoffeeScript
layout: docs
category: Quick Start
permalink: tutorial-coffeescript.html
previous: tutorial-jquery
next: common-js-testing
---

Jest doesn't come with builtin support for CoffeeScript but can easily be configured in order to make it work. CoffeeScript differs from JavaScript on two aspects, file extensions are different and you need to compile your file from CoffeeScript to plain JavaScript. Here is how you set it up with Jest.


```javascript
// package.json
  "jest": {
    "scriptPreprocessor": "preprocessor.js",
    "testExtensions": ["coffee", "js"]
  }
```

```
// preprocessor.js
var coffee = require('coffee-script');

module.exports = {
  process: function(src, path) {
    if (path.match(/\.coffee$/)) {
      return coffee.compile(src, {'bare': true});
    }
    return src;
  }
};
```

Once you have this, anything that you would have written in JavaScript, you can also write in CoffeeScript. You can write both tests and code in CoffeeScript, just the tests in CoffeeScript or just the code.


```javascript
// sum.coffee
sum = (a, b) ->
  a + b

module.exports = sum
```

```javascript
// __tests__/sum-test.coffee
jest
  .dontMock '../sum.coffee'

describe 'sum', ->
  it 'adds 1 + 2 to equal 3', ->
    sum = require '../sum.coffee'
    expect(sum 1, 2).toBe 3
```

