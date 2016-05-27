// Initialize jasmine-check within the vm context:
jest.unmock('jasmine-check');
require('jasmine-check').install();

// Replace the 'check' functions with ones that default to options from
// the jest configuration:
(function() {
  const configOptions = jasmine.testcheckOptions;
  function makeMergeOptions(object, methodName) {
    const original = object[methodName];
    object[methodName] = function(specName, options, argGens, propertyFn) {
      if (!propertyFn) {
        propertyFn = argGens;
        argGens = options;
        options = {};
      }
      const mergedOptions = Object.assign({}, configOptions, options);
      return original(specName, mergedOptions, argGens, propertyFn);
    };
  }

  makeMergeOptions(check, 'it');
  makeMergeOptions(check, 'iit');
  makeMergeOptions(check.it, 'only');
  makeMergeOptions(check, 'fit');
  makeMergeOptions(check, 'xit');
})();

jasmine.testcheckOptions = undefined;
