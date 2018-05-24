'use strict';

module.exports = function(tests) {
  return {
    tests: tests.filter(t => t.indexOf('foo') !== -1),
  };
};
