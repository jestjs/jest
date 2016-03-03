---
id: tutorial-react
title: Tutorial – React
layout: docs
category: Quick Start
permalink: docs/tutorial-react.html
next: tutorial-jquery
---

At Facebook, we use Jest to test [React](http://facebook.github.io/react/)
applications. Let's implement a simple checkbox which swaps between two labels:

```javascript
// CheckboxWithLabel.js
'use strict';

import React from 'react';

export default class CheckboxWithLabel extends React.Component {

  constructor(props) {
    super(props);
    this.state = {isChecked: false};

    // bind manually because React class components don't auto-bind
    // http://facebook.github.io/react/blog/2015/01/27/react-v0.13.0-beta-1.html#autobinding
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
```

The test code is pretty straightforward; we use React's
[TestUtils](http://facebook.github.io/react/docs/test-utils.html) in order to
manipulate React components.

```javascript
// __tests__/CheckboxWithLabel-test.js
'use strict';

jest.unmock('../CheckboxWithLabel');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import CheckboxWithLabel from '../CheckboxWithLabel';

describe('CheckboxWithLabel', () => {

  it('changes the text after click', () => {
    // Render a checkbox with label in the document
    const checkbox = TestUtils.renderIntoDocument(
      <CheckboxWithLabel labelOn="On" labelOff="Off" />
    );

    const checkboxNode = ReactDOM.findDOMNode(checkbox);

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
the test work. We are going to use the `babel-jest` package as a preprocessor
for Jest. Also see [babel integration](/jest/docs/getting-started.html#babel-integration).

```javascript
// package.json
    "dependencies": {
    "react": "~0.14.0",
    "react-dom": "~0.14.0"
  },
  "devDependencies": {
    "babel-jest": "^9.0.0",
    "babel-preset-es2015": "*",
    "babel-preset-react": "*",
    "jest-cli": "*",
    "react-addons-test-utils": "~0.14.0"
  },
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "unmockedModulePathPatterns": [
      "<rootDir>/node_modules/react",
      "<rootDir>/node_modules/react-dom",
      "<rootDir>/node_modules/react-addons-test-utils"
    ]
  }
```

```javascript
// .babelrc
{
  "presets": ["es2015", "react"]
}
```

Run ```npm install```.

**And you're good to go!**

React is designed to be tested without being mocked and ships with `TestUtils`
to help. Therefore, we use `unmockedModulePathPatterns` to prevent React from
being mocked.

The code for this example is available at
[examples/react/](https://github.com/facebook/jest/tree/master/examples/react).

### Rolling your own preprocessor

Instead of using babel-jest, here is an example of using babel to build your own
preprocessor:

```javascript
'use strict';

const babel = require('babel-core');
const jestPreset = require('babel-preset-jest');
const path = require('path');

const NODE_MODULES = path.sep + 'node_modules' + path.sep;

module.exports = {
  process(src, filename) {
    if (!filename.includes(NODE_MODULES) && babel.util.canCompile(filename)) {
      return babel.transform(src, {
        filename,
        presets: [jestPreset],
        retainLines: true,
      }).code;
    }
    return src;
  },
};

```

In fact, this is the entire [source code](https://github.com/facebook/jest/blob/master/packages/babel-jest/src/index.js)
of `babel-jest`!

*Note: Don't forget to install the `babel-core` and `babel-preset-jest` packages
for this example to work!*
