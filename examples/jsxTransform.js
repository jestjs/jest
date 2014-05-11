var ReactTools = require('react-tools');

module.exports = {
  process: function(src) {
    return 'var __DEV__ = true;' + ReactTools.transform(src, {harmony: true});
  }
};
