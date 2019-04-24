// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

'use strict';

const JSDOMEnvironment = require('jest-environment-jsdom');

class TestEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
    this.global.myCustomPragma = context.docblockPragmas['my-custom-pragma'];
  }
}

module.exports = TestEnvironment;
