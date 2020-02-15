// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import Intro from './Intro';
import React, {Component} from 'react';
import {AppRegistry} from 'react-native';

class App extends Component<{}> {
  render() {
    return <Intro />;
  }
}

AppRegistry.registerComponent('jestrn', () => App);
