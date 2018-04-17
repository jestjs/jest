const defaultResolver = require('jest-resolve/build/default_resolver').default;

const exportedModules = new Map([
  ['foo', 'foo'],
  ['bar', 'bar'],
  ['regenerator-runtime/runtime', 'fake-regenerator'],
]);

module.exports = (name, options) => {
  const resolution = exportedModules.get(name);

  if (resolution) {
    return `${__dirname}/${resolution}.js`;
  } else {
    return defaultResolver(name, options);
  }
};
