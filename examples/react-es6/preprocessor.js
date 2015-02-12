var to5 = require('6to5-core');

module.exports = {
  process: function(src, filename) {
    // Ignore all files within node_modules
    // 6to5 files can be .js, .es, .jsx or .es6
    if (filename.indexOf('node_modules') === -1 && to5.canCompile(filename)) {
      return to5.transform(src, { filename: filename }).code;
    }
    return src;
  }
};
