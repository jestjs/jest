'use strict';

const {
  TestEnvironment: JSDOMTestEnvironment,
} = require('jest-environment-jsdom');

module.exports = class AngularEnv extends JSDOMTestEnvironment {
  exportConditions() {
    // we need to include `node` as `rxjs` defines `node`, `es2015`, `default`, not `browser` or `require`
    return super.exportConditions().concat('node');
  }
};
