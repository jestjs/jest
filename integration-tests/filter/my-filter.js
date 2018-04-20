'use strict';

module.exports = function(tests) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(tests.filter(t => t.indexOf('foo') !== -1));
    }, 500);
  });
};
