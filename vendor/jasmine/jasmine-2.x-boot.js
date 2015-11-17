(function(root) {
  root.jasmine = jasmineRequire.core(jasmineRequire);

  var env = jasmine.getEnv();
  var jasmineInterface = jasmineRequire.interface(jasmine, env);

  extend(root, jasmineInterface);

  env.addReporter(jasmineInterface.jsApiReporter);

  /**
   * Setting up timing functions to be able to be overridden. Certain browsers (Safari, IE 8, phantomjs) require this hack.
   */
  root.setTimeout = root.setTimeout;
  root.setInterval = root.setInterval;
  root.clearTimeout = root.clearTimeout;
  root.clearInterval = root.clearInterval;

  function extend(destination, source) {
    for (var property in source) destination[property] = source[property];
      return destination;
  }
})(this);
