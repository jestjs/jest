const runBenchmark = require('./runBenchmark');

class BenchmarkRunner {
  constructor(hasteContext: HasteContext, config: Config) {
    this._config = config;
  }
  async runBenches(benchPaths: Array<string>) {
    try {
      for (let i = 0, len = benchPaths.length; i < len; i++) {
        await runBenchmark(
          benchPaths[i],
          this._config,
          null,
        );
      }
    } catch (err) {
      throw err;
    }
  }
}

module.exports = BenchmarkRunner;
