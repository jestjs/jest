const dynamicModuleName = 'source';

module.exports.withStandardResolution = () =>
  require(`./${dynamicModuleName}.js`);
module.exports.withCustomResolution = () =>
  require(`$asdf/${dynamicModuleName}.js`);
