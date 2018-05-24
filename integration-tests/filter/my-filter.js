'use strict';

module.exports = async function(tests) {
  const filtered = await new Promise(resolve => {
    setTimeout(() => {
      resolve(
        tests
          .filter(t => t.indexOf('foo') !== -1)
          .map(test => ({message: 'some message', test}))
      );
    }, 100);
  });

  return {
    filtered,
  };
};
