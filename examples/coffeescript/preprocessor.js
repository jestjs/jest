var coffee = require('coffee-script');

module.exports = {
  process: function(src) {
    return coffee.compile(src, {'bare': true});
  }
};
