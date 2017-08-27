/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import Intro from './Intro';
import React, {AppRegistry} from 'react-native';
import {Component} from 'react';

class App extends Component<{}> {
  render() {
    return <Intro />;
  }
}

AppRegistry.registerComponent('jestrn', () => App);
