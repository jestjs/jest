import jest from 'jest';

const {globalConfig, configs} = await jest.readConfigs(process.argv, ['.']);
const runConfig = Object.freeze({
  ...globalConfig,
  collectCoverage: false,
  watch: false,
});
const {result} = await jest.runCore(runConfig, configs);
console.log(`runCore success, ${result.numPassedTests} passed tests.`);
