// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

'use strict';

const JSDOMEnvironment = require('jest-environment-jsdom');

class TestEnvironment extends JSDOMEnvironment {
  handleTestEvent(event) {
    console.log(event.name + (event.test ? ': ' + event.test.name : ''));
  }
}

module.exports = TestEnvironment;
