/* jasmine-only - 0.1.1
 * Exclusivity spec helpers for jasmine: `describe.only` and `it.only`
 * https://github.com/davemo/jasmine-only
 */
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(jasmine) {
    var describeOnly, env, itOnly, root;
    root = (1, eval)('this');
    env = jasmine.getEnv();
    describeOnly = function(description, specDefinitions) {
      var suite;
      suite = new jasmine.Suite(this, description, null, this.currentSuite);
      suite.exclusive_ = 1;
      this.exclusive_ = Math.max(this.exclusive_, 1);
      return this.describe_(suite, specDefinitions);
    };
    itOnly = function(description, func) {
      var spec;
      spec = this.it(description, func);
      spec.exclusive_ = 2;
      this.exclusive_ = 2;
      return spec;
    };
    env.exclusive_ = 0;
    env.describe = function(description, specDefinitions) {
      var suite;
      suite = new jasmine.Suite(this, description, null, this.currentSuite);
      return this.describe_(suite, specDefinitions);
    };
    env.describe_ = function(suite, specDefinitions) {
      var declarationError, e, parentSuite;
      parentSuite = this.currentSuite;
      if (parentSuite) {
        parentSuite.add(suite);
      } else {
        this.currentRunner_.add(suite);
      }
      this.currentSuite = suite;
      declarationError = null;
      try {
        specDefinitions.call(suite);
      } catch (_error) {
        e = _error;
        declarationError = e;
      }
      if (declarationError) {
        this.it("encountered a declaration exception", function() {
          throw declarationError;
        });
      }
      this.currentSuite = parentSuite;
      return suite;
    };
    env.specFilter = function(spec) {
      return this.exclusive_ <= spec.exclusive_;
    };
    env.describe.only = function() {
      return describeOnly.apply(env, arguments);
    };
    env.it.only = function() {
      return itOnly.apply(env, arguments);
    };
    root.describe.only = function(description, specDefinitions) {
      return env.describe.only(description, specDefinitions);
    };
    root.it.only = function(description, func) {
      return env.it.only(description, func);
    };
    root.iit = root.it.only;
    root.ddescribe = root.describe.only;
    jasmine.Spec = (function(_super) {
      __extends(Spec, _super);

      function Spec(env, suite, description) {
        this.exclusive_ = suite.exclusive_;
        Spec.__super__.constructor.call(this, env, suite, description);
      }

      return Spec;

    })(jasmine.Spec);
    return jasmine.Suite = (function(_super) {
      __extends(Suite, _super);

      function Suite(env, suite, specDefinitions, parentSuite) {
        this.exclusive_ = parentSuite && parentSuite.exclusive_ || 0;
        Suite.__super__.constructor.call(this, env, suite, specDefinitions, parentSuite);
      }

      return Suite;

    })(jasmine.Suite);
  })(jasmine);

}).call(this);
