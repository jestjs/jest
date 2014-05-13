---
id: tutorial-react
title: Tutorial - React
layout: docs
category: Quick Start
permalink: docs/tutorial-react.html
next: common-js-testing
---

Jest is being used at Facebook to test [React](http://facebook.github.io/react/) applications. Let's implement a dummy checkbox which swaps between two labels.

```javascript
// CheckboxWithLabel.js

/** @jsx React.DOM */
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

The test code is pretty straightforward, we use [TestUtils](http://facebook.github.io/react/docs/test-utils.html) in order to manipulate React components.

```javascript
// __tests__/CheckboxWithLabel-test.js

/** @jsx React.DOM */
jest.dontMock('../CheckboxWithLabel.js');
describe('CheckboxWithLabel', function() {
  it('changes the text after click', function() {
    var React = require('react/addons');
    var CheckboxWithLabel = require('../CheckboxWithLabel.js');
    var TestUtils = React.addons.TestUtils;

    // Render a checkbox with label in the document
    var checkbox = <CheckboxWithLabel labelOn="On" labelOff="Off" />;
    TestUtils.renderIntoDocument(checkbox);

    // Verify that it's Off by default
    var label = TestUtils.findRenderedDOMComponentWithTag(
      checkbox, 'label');
    expect(label.getDOMNode().textContent).toEqual('Off');

    // Simulate a click and verify that it is now On
    var input = TestUtils.findRenderedDOMComponentWithTag(
      checkbox, 'input');
    TestUtils.Simulate.change(input);
    expect(label.getDOMNode().textContent).toEqual('On');
  });
});
```

## Setup

Since we are writing code using JSX and import React directly from source, a bit of one-time setup is required to make the test working. This is also a good introduction to all the jest configurations that are you are going to use in order to integrate it with your stack.

```javascript
// package.json
  "dependencies": {
    "react": "*",
    "react-tools": "*"
  },
  "jest": {
    "scriptPreprocessor": "preprocessor.js",
    "unmockedModulePathPatterns": ["node_modules/react"]
    "testPathIgnorePatterns": ["node_modules"],
    "setupEnvScriptFile": "environment.js",
  }
```

We are pulling React directly from source, since it is written with ES6 features, we need to setup a preprocessor that ships with `react-tools` and set the flag `harmony: true`. This also gives us JSX transform as well.

```javascript
// preprocessor.js
var ReactTools = require('react-tools');
module.exports = {
  process: function(src) {
    return ReactTools.transform(src, {harmony: true});
  }
};
```

React is designed to be tested without being mocked and ships with `TestUtils` to help. Therefore we use `unmockedModulePathPatterns` to prevent itself from being mocked.

React has a lot of tests written in Jest. Since you probably don't want to run React tests in your application, you can blacklist all the tests from `node_modules` using `testPathIgnorePatterns`.

Finally, React has two modes, a development one with many warnings and assertions and a live one where they are stripped. This is controlled using a global called `__DEV__`. Jest lets you set globals using `setupEnvScriptFile`.

```javascript
// environment.js
__DEV__ = true;
```

The code for this example is on [examples/react/](https://github.com/facebook/jest/tree/master/examples/react)
