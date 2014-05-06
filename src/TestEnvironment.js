'use strict';

function TestEnvironment(contextGlobal, contextRunner, disposeFn) {
  this.disposeFn = disposeFn;
  this.global = contextGlobal;
  this.runSourceText = contextRunner;
}

module.exports = TestEnvironment;
