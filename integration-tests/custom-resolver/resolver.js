const defaultResolver = require('jest-resolve/build/default_resolver').default;

module.exports = (name, options) => {
  if (name === 'foo' || name === 'bar') {
    return `${__dirname}/${name}.js`;
  } else {
    return defaultResolver(name, options);
  }
};
