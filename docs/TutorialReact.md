---
id: tutorial-react
title: Tutorial – React
layout: docs
category: Quick Start
permalink: docs/tutorial-react.html
next: common-js-testing
---

At Facebook, we use Jest to test [React](http://facebook.github.io/react/) applications. Let's implement a simple checkbox which swaps between two labels:

```javascript
// CheckboxWithLabel.js

var React = require('react/addons');
var CheckboxWithLabel = React.createClass({
  getInitialState: function() {
    return { isChecked: false };
  },
  onChange: function() {
    this.setState({isChecked: !this.state.isChecked});
  },
  render: function() {
    return (
      <label>
        <input
          type="checkbox"
          checked={this.state.isChecked}
          onChange={this.onChange}
        />
        {this.state.isChecked ? this.props.labelOn : this.props.labelOff}
      </label>
    );
  }
});
module.exports = CheckboxWithLabel;
```

The test code is pretty straightforward; we use React's [TestUtils](http://facebook.github.io/react/docs/test-utils.html) in order to manipulate React components.

```javascript
// __tests__/CheckboxWithLabel-test.js

jest.dontMock('../CheckboxWithLabel.js');
describe('CheckboxWithLabel', function() {
  it('changes the text after click', function() {
    var React = require('react/addons');
    var CheckboxWithLabel = require('../CheckboxWithLabel.js');
    var TestUtils = React.addons.TestUtils;

    // Render a checkbox with label in the document
    var checkbox = TestUtils.renderIntoDocument(
      <CheckboxWithLabel labelOn="On" labelOff="Off" />
    );

    // Verify that it's Off by default
    var label = TestUtils.findRenderedDOMComponentWithTag(
      checkbox, 'label');
    expect(React.findDOMNode(label).textContent).toEqual('Off');

    // Simulate a click and verify that it is now On
    var input = TestUtils.findRenderedDOMComponentWithTag(
      checkbox, 'input');
    TestUtils.Simulate.change(input);
    expect(React.findDOMNode(label).textContent).toEqual('On');
  });
});
```

## Setup

Since we are writing code using JSX, a bit of one-time setup is required to make the test work:

```javascript
// package.json
  "dependencies": {
    "react": "*",
    "babel-jest": "*",
    "jest-cli": "*"
  },
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "scriptPreprocessor": "<rootDir>/node_modules/babel-jest",
    "unmockedModulePathPatterns": ["<rootDir>/node_modules/react"]
  }
```

**And you're good to go!**

##### Using experimental stages

By default, babel-jest will use Babel's default stage (stage 2).
If you'd like to use one of the other stages, set the environment variable:

```javascript
  "scripts": {
    "test": "BABEL_JEST_STAGE=0 jest"
  }
```  


#### Customizing Setup

Instead of using babel-jest, here is an example of using babel to build your own preprocessor.

```javascript
var babel = require("babel-core");

module.exports = {
  process: function (src, filename) {
    // Allow the stage to be configured by an environment
    // variable, but use Babel's default stage (2) if
    // no environment variable is specified.
    var stage = process.env.BABEL_JEST_STAGE || 2;

    // Ignore all files within node_modules
    // babel files can be .js, .es, .jsx or .es6
    if (filename.indexOf("node_modules") === -1 && babel.canCompile(filename)) {
      return babel.transform(src, {
        filename: filename,
        stage: stage,
        retainLines: true,
        auxiliaryCommentBefore: "istanbul ignore next"
      }).code;
    }

    return src;
  }
};
```

React is designed to be tested without being mocked and ships with `TestUtils` to help. Therefore, we use `unmockedModulePathPatterns` to prevent React from being mocked.

The code for this example is available at [examples/react/](https://github.com/facebook/jest/tree/master/examples/react).
