---
id: tutorial-react
title: Tutorial – React
layout: docs
category: Quick Start
permalink: docs/tutorial-react.html
next: tutorial-webpack-integration
---

At Facebook, we use Jest to test [React](http://facebook.github.io/react/)
applications. Let's implement a simple checkbox which swaps between two labels:

```javascript
// CheckboxWithLabel.js
import React from 'react';

class CheckboxWithLabel extends React.Component {

  constructor(props) {
    super(props);
    this.state = {isChecked: false};

    this.onChange = this.onChange.bind(this);
  }

  onChange() {
    this.setState({isChecked: !this.state.isChecked});
  }

  render() {
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
}

export default CheckboxWithLabel;
```

The test code is pretty straightforward; we use React's
[TestUtils](http://facebook.github.io/react/docs/test-utils.html) in order to
manipulate React components.

```javascript
// __tests__/CheckboxWithLabel-test.js
jest.dontMock('../CheckboxWithLabel');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const CheckboxWithLabel = require('../CheckboxWithLabel');

describe('CheckboxWithLabel', () => {

  it('changes the text after click', () => {

    // Render a checkbox with label in the document
    var checkbox = TestUtils.renderIntoDocument(
      <CheckboxWithLabel labelOn="On" labelOff="Off" />
    );

    var checkboxNode = ReactDOM.findDOMNode(checkbox);

    // Verify that it's Off by default
    expect(checkboxNode.textContent).toEqual('Off');

    // Simulate a click and verify that it is now On
    TestUtils.Simulate.change(
      TestUtils.findRenderedDOMComponentWithTag(checkbox, 'input')
    );
    expect(checkboxNode.textContent).toEqual('On');
  });

});
```

## Setup

Since we are writing code using JSX, a bit of one-time setup is required to make
the test work. We are going to use the babel-jest package as a preprocessor for
jest.

```javascript
// package.json
  "dependencies": {
    "react": "~0.14.0",
    "react-dom": "~0.14.0"
  },
  "devDependencies": {
    "babel-jest": "*",
    "jest-cli": "*",
    "react-addons-test-utils": "~0.14.0",
    "babel-preset-es2015": "*",
    "babel-preset-react": "*"
  },
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "scriptPreprocessor": "<rootDir>/node_modules/babel-jest",
    "unmockedModulePathPatterns": [
      "<rootDir>/node_modules/react",
      "<rootDir>/node_modules/react-dom",
      "<rootDir>/node_modules/react-addons-test-utils",
      "<rootDir>/node_modules/fbjs"
    ]
  }
```

```javascript
// .babelrc
{
  presets: ['es2015', 'react']
}
```
Run ```npm install```.

**And you're good to go!**

React is designed to be tested without being mocked and ships with `TestUtils`
to help. Therefore, we use `unmockedModulePathPatterns` to prevent React from
being mocked.

The code for this example is available at
[examples/react/](https://github.com/facebook/jest/tree/master/examples/react).


### Using experimental stages with babel-jest

By default, babel-jest will use Babel's default stage (stage 2).
If you'd like to use one of the other stages, set the environment variable:

```javascript
  "scripts": {
    "test": "BABEL_JEST_STAGE=0 jest"
  }
```  

### Rolling your own preprocessor

Instead of using babel-jest, here is an example of using babel to build your own
preprocessor.

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

Don't forget to install the babel-core package for this example to work.
