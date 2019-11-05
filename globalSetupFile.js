// Jest creates a copy of the global 'process' object and uses it instead of the one provided by node.
// Since 'require'-ing the 'domain' module has a side-effect that modifies "process" to make it work with domains,
// 'domain' has to be required before Jest performs the copy, i.e. in the global-setup phase represented by this file.

module.exports = () => {
  require('domain');
};
