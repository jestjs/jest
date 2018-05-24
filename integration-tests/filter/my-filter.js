'use strict';

module.exports = async function(tests) {
  const filteredTests = await new Promise(resolve => {
    setTimeout(() => {
      resolve(tests.filter(t => t.indexOf('foo') !== -1));
    }, 100);
  });

  return {
    tests: filteredTests,
  };
};
