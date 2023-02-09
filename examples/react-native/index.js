// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import {AppRegistry} from 'react-native';
import Intro from './Intro';

class App extends Component<{}> {
  render() {
    return <Intro />;
  }
}

AppRegistry.registerComponent('jestrn', () => App);
