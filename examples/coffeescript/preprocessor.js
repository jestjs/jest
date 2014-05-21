var coffee = require('coffee-script');
// This will register all of the coffee extensions for use with require(). Even
// though Jest doesn't use the default require much this is needed to populate
// `require.extensions`.
coffee.register()

module.exports = {
  process: function(src, path) {
    // CoffeeScript files can be .coffee, .litcoffee, or .coffee.md
    if (coffee.helpers.isCoffee(path)) {
      return coffee.compile(src, {'bare': true});
    }
    return src;
  }
};
