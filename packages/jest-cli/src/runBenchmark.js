
const Runtime = require('jest-runtime');
const {ModuleMap} = require('jest-haste-map');
const BufferedConsole = require('./lib/BufferedConsole');
const {
  Console,
  NullConsole,
  setGlobal,
} = require('jest-util');
const getConsoleOutput = require('./reporters/getConsoleOutput');
const chalk = require('chalk');

const resolvers = Object.create(null);

function getResolver(config, rawModuleMap) {
  if (rawModuleMap) {
    return Runtime.createResolver(
      config,
      new ModuleMap(rawModuleMap.map, rawModuleMap.mocks),
    );
  } else {
    const name = config.name;
    if (!resolvers[name]) {
      resolvers[name] = Runtime.createResolver(
        config,
        Runtime.createHasteMap(config).readModuleMap(),
      );
    }
    return resolvers[name];
  }
}

function runBenchmark(path: Path, config: Config, _resolver: Resolver) {
  let resolver = _resolver;
  if (!_resolver) {
    resolver = getResolver(config, null);
  }
  /* $FlowFixMe */
  const BenchEnvironment = require(config.benchEnvironment);
  /* $FlowFixMe */
  const BenchmarkRunner = require(config.benchRunner);
  /* $FlowFixMe */
  const ModuleLoader = require(config.moduleLoader || 'jest-runtime');

  const env = new BenchEnvironment(config);
  const TestConsole =
    config.verbose
      ? Console
      : (config.silent
        ? NullConsole
        : BufferedConsole
      );
  const testConsole = new TestConsole(
    config.useStderr ? process.stderr : process.stdout,
    process.stderr,
    (type, message) => getConsoleOutput(
      config.rootDir,
      !!config.verbose,
      // 4 = the console call is burried 4 stack frames deep
      BufferedConsole.write([], type, message, 4),
    ),
  );
  setGlobal(env.global, 'console', testConsole);
  const runtime = new ModuleLoader(config, env, resolver);

  return BenchmarkRunner(config, env, runtime, path)
    .then(results => {
      console.log(chalk.gray('Ran all benchmark suites.'));
    }, err => {
      env.dispose();
      throw err;
    });
}

module.exports = runBenchmark;
