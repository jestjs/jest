var CoffeeScript = require('coffee-script');

module.exports = {
  process: function(src, path) {
    // CoffeeScript files can be .coffee, .litcoffee, or .coffee.md
    if (CoffeeScript.helpers.isCoffee(path)) {
      return CoffeeScript.compile(src, {
        'bare': true,
        'literate': CoffeeScript.helpers.isLiterate(path)
      });
    }
    return src;
  }
};
