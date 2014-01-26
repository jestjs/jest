function TestEnvironment(contextGlobal, contextRunner) {
  this.global = contextGlobal;
  this.runSourceText = contextRunner;
}

module.exports = TestEnvironment;
