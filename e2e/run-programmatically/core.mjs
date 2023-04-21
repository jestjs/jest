import jest from 'jest';

const {globalConfig, configs} = await jest.readConfigs(process.argv, ['.']);
const runConfig = Object.freeze({
  ...globalConfig,
  collectCoverage: false,
  json: true,
  watch: false,
});
const {result} = await jest.runCore(runConfig, configs);
console.log('==== results ====');
console.log(JSON.stringify(result, null, 2));
