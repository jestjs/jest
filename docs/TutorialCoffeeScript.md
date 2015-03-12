---
id: tutorial-coffeescript
title: Tutorial – CoffeeScript
layout: docs
category: Quick Start
permalink: docs/tutorial-coffeescript.html
next: tutorial-react
---

Jest doesn't come with built-in support for CoffeeScript but can easily be configured in order to make it work. To use CoffeeScript, you need to tell Jest to look for `*.coffee` files and to run them through the CoffeeScript compiler when requiring them. Here's how to set it up with Jest:


```javascript
// package.json
  "dependencies": {
    "coffee-script": "*"
  },
  "jest": {
    "scriptPreprocessor": "preprocessor.js",
    "testFileExtensions": ["coffee", "litcoffee", "coffee.md", "js"],
    "moduleFileExtensions": ["coffee", "litcoffee", "coffee.md", "js"]
  }
```

```
// preprocessor.js
var coffee = require('coffee-script');

module.exports = {
  process: function(src, path) {
    // CoffeeScript files can be .coffee, .litcoffee, or .coffee.md
    if (coffee.helpers.isCoffee(path)) {
      return coffee.compile(src, {'bare': true});
    }
    return src;
  }
};
```

Once you have this, you can use CoffeeScript with Jest in any place you would have written JavaScript. You can write all of your tests and code in CoffeeScript or mix and match, using CoffeeScript in some files and plain JavaScript in others.


```javascript
# sum.coffee
sum = (a, b) ->
  a + b
module.exports = sum
```

```javascript
# __tests__/sum-test.coffee
jest.dontMock '../sum.coffee'
describe 'sum', ->
  it 'adds 1 + 2 to equal 3', ->
    sum = require '../sum.coffee'
    expect(sum 1, 2).toBe 3
```

The code for this example is availabe at [examples/coffeescript/](https://github.com/facebook/jest/tree/master/examples/coffeescript).

