class MockStdinWatchPlugin {
  constructor({stdin, config}) {
    this._stdin = stdin;
    this._stdin.setRawMode = function() {};
    this._config = config;
  }

  apply(jestHooks) {
    jestHooks.onTestRunComplete(() => {
      const {type} = this._config.input.shift();
      type.split('').forEach(key => this._stdin.emit('data', key));
    });
  }
}
module.exports = MockStdinWatchPlugin;
