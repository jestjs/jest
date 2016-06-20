---
id: tutorial-react-native
title: Tutorial – React Native
layout: docs
category: Quick Start
---

Integrating Jest with React Native is possible by following this quick setup guide.

Let's get started with the ```package.json``` file:

```js
// package.json
{
  "name": "ReactNativeJest",
  "version": "0.0.1",
  "jest": {
    "scriptPreprocessor": "<rootDir>/node_modules/babel-jest",
    "unmockedModulePathPatterns": [
      "node_modules"
    ]
  },
  "babel": {
    "presets": ["react-native"]
  },
  "scripts": {
    "test": "jest"
  },
  "dependencies": {
    "react": "^15.1.0",
    "react-native": "^0.27.2"
  },
  "devDependencies": {
    "babel-core": "^6.4.5",
    "babel-jest": "^12.1.0",
    "babel-polyfill": "^6.0.16",
    "babel-preset-react-native": "^1.9.0",
    "babel-types": "^6.1.2",
    "chai": "^3.5.0",
    "enzyme": "^2.3.0",
    "jest-cli": "^12.1.1",
    "react-addons-test-utils": "^15.1.0",
    "react-dom": "^15.1.0"
  }
}
```
Now that you have the correct package setup, you need to make sure to mock ```react-native``` when running the tests. The easiest way to do this is to create a file in ```__mocks__/react-native.js```. Jest will know to use this file to mock ```react-native```. Here is a starter example:

```js
// __mocks__/react-native.js
'use strict';

var React = require('react');
var ReactNative = React;

ReactNative.StyleSheet = {
  create: function(styles) {
    return styles;
  }
};

// Continue to replace components as you need them
class View extends React.Component {}
class Text extends React.Component {}

ReactNative.View = View;
ReactNative.Text = Text;

module.exports = ReactNative;
```
In this example, you can see that we replaced ```react-native```'s ```Text``` and ```View``` components with empty ```React.Component```'s. This is because the component we will test uses both of these components. For example:

```js
// ./src/Home.js
'use strict';

import React from 'react';
import {
  Text,
  View
} from 'react-native';

class Home extends React.Component {
  render() {
    return (
      <View>
        <Text>
          React Native Test Examples
        </Text>
      </View>
    );
  }
}

export default Home;
```
And it's corresponding test:

```js
// ./src/__tests__/Home-test.js
'use strict';

import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Text } from 'react-native';

const Home = require.requireActual('../Home').default;

describe("<Home />", () => {
  it("should contain the welcome text", () => {
    const homeComponent = shallow(<Home />);

    expect(homeComponent
      .find(Text)
      .first()
      .props()
      .children
    ).to.equal("React Native Test Examples");
  });
});
```
And voila! You have a working Jest test! This was tested against ReactNative version ```0.27.2```. You can find a [passing build example on GitHub here](/jest/docs/getting-started.html).
