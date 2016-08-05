---
id: tutorial-react
title: Tutorial – React
layout: docs
category: Quick Start
permalink: docs/tutorial-react.html
next: tutorial-react-native
---

At Facebook, we use Jest to test [React](http://facebook.github.io/react/)
applications.

## Setup

We are using the `babel-jest` package and the `react` babel preset to transform our code inside of the test environment. Also see [babel integration](/jest/docs/getting-started.html#babel-integration).

Run

```javascript
npm install --save-dev jest babel-jest babel-preset-es2015 babel-preset-react react-test-renderer
```

Your `package.json` should look something like this (where `<current-version>` is the actual latest version number for the package). Please add the scripts and jest configuration entries:

```javascript
// package.json
  "dependencies": {
    "react": "<current-version>",
    "react-dom": "<current-version>"
  },
  "devDependencies": {
    "babel-jest": "<current-version>",
    "babel-preset-es2015": "<current-version>",
    "babel-preset-react": "<current-version>",
    "jest": "<current-version>",
    "react-test-renderer": "<current-version>"
  },
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "automock": false
  }
```

```javascript
// .babelrc
{
  "presets": ["es2015", "react"]
}
```

**And you're good to go!**

React is designed to be tested without being mocked and we recommend turning automocking off using `"automock: false"` in Jest's configuration.

If you'd like to use Jest's automocking feature you can unmock React explicitly:

```javascript
"jest": {
  "unmockedModulePathPatterns": [
    "<rootDir>/node_modules/react/",
    "<rootDir>/node_modules/react-dom/",
    "<rootDir>/node_modules/react-test-renderer/",
    "<rootDir>/node_modules/react-addons-test-utils/"
  ]
}
```

### Snapshot Testing

Snapshot testing was introduced in Jest 14.0. More information on how it works and why we built it can be found on the [release blog post](/jest/blog/2016/07/27/jest-14.html).

Let's build a Link component in React that renders hyperlinks:

```javascript
// Link.react-test.js
import React from 'react';

const STATUS = {
  NORMAL: 'normal',
  HOVERED: 'hovered',
};

export default class Link extends React.Component {

  constructor() {
    super();

    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);

    this.state = {
      class: STATUS.NORMAL,
    };
  }

  _onMouseEnter() {
    this.setState({class: STATUS.HOVERED});
  }

  _onMouseLeave() {
    this.setState({class: STATUS.NORMAL});
  }

  render() {
    return (
      <a
        className={this.state.class}
        href={this.props.page || '#'}
        onMouseEnter={this._onMouseEnter}
        onMouseLeave={this._onMouseLeave}>
        {this.props.children}
      </a>
    );
  }

}
```

Now let's use React's test renderer and Jest's snapshot feature to interact with the component and capture the rendered output and create a snapshot file:

```javascript
// Link.react-test.js
import React from 'react';
import Link from '../Link.react';
import renderer from 'react-test-renderer';

describe('Link', () => {
  it('changes the class when hovered', () => {
    const component = renderer.create(
      <Link page="http://www.facebook.com">Facebook</Link>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // manually trigger the callback
    tree.props.onMouseEnter();
    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // manually trigger the callback
    tree.props.onMouseLeave();
    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
```

When you run `npm test` or `jest`, this will produce an output file like this:

```javascript
// __tests__/__snapshots__/Link.react-test.js.snap
exports[`Link changes the class when hovered 1`] = `
<a
  className="normal"
  href="http://www.facebook.com"
  onMouseEnter={[Function bound _onMouseEnter]}
  onMouseLeave={[Function bound _onMouseLeave]}>
  Facebook
</a>
`;

exports[`Link changes the class when hovered 2`] = `
<a
  className="hovered"
  href="http://www.facebook.com"
  onMouseEnter={[Function bound _onMouseEnter]}
  onMouseLeave={[Function bound _onMouseLeave]}>
  Facebook
</a>
`;

exports[`Link changes the class when hovered 3`] = `
<a
  className="normal"
  href="http://www.facebook.com"
  onMouseEnter={[Function bound _onMouseEnter]}
  onMouseLeave={[Function bound _onMouseLeave]}>
  Facebook
</a>
`;
```

The next time you run the tests, the rendered output will be compared to the previously created snapshot. The snapshot should be committed along code changes. When a snapshot test fails, you need to inspect whether it is an intended or unintended change. If the change is expected you can invoke Jest with `jest -u` to overwrite the existing snapshot.

The code for this example is available at
[examples/snapshot](https://github.com/facebook/jest/tree/master/examples/snapshot).

### DOM Testing

If you'd like to instead render components to a mock implementation of the DOM APIs you can use the DOM renderer and the `jsdom` `testEnvironment`. You have to run `npm install --save-dev react-addons-test-utils` to use React's test utils.

Let's implement a simple checkbox which swaps between two labels:

```javascript
// CheckboxWithLabel.js

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

We use React's [TestUtils](http://facebook.github.io/react/docs/test-utils.html) in order to
manipulate React components.

```javascript
// __tests__/CheckboxWithLabel-test.js

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

Alternatively you can also use [enzyme](https://github.com/airbnb/enzyme) to test DOM components.

The code for this example is available at
[examples/react](https://github.com/facebook/jest/tree/master/examples/react).

### Building your own preprocessor

Instead of using babel-jest, here is an example of using babel to build your own
preprocessor:

```javascript
'use strict';

const babel = require('babel-core');
const jestPreset = require('babel-preset-jest');

module.exports = {
  process(src, filename) {
    if (babel.util.canCompile(filename)) {
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
