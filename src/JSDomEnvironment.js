'use strict';

var mockTimers = require('./lib/mockTimers');
var TestEnvironment = require('./TestEnvironment');

function JSDomEnvironment() {
  // We lazily require jsdom because it takes a good ~.5s to load.
  //
  // Since this file may be require'd at the top of other files that may/may not
  // use it (depending on the context -- such as TestRunner.js when operating as
  // a workerpool parent), this is the best way to ensure we only spend time
  // require()ing this when necessary.
  this.global = require('./lib/jsdom-compat').jsdom().parentWindow;

  // Setup window.location
  Object.defineProperty(this.global.location, 'hostname', {
    value: ''
  });
  Object.defineProperty(this.global.location, 'host', {
    value: ''
  });

  // Setup defaults for navigator.onLine
  // TODO: It's questionable as to whether this should go here
  //       It's a pretty rarely depended on feature, so maybe tests that care
  //       about it should just shim it themselves?)
  this.global.navigator.onLine = true;

  // Pass node's TypedArray implementation through
  this.global.ArrayBuffer = ArrayBuffer;
  this.global.Float32Array = Float32Array;
  this.global.Int16Array = Int16Array;
  this.global.Int32Array = Int32Array;
  this.global.Int8Array = Int8Array;
  this.global.Uint8Array = Uint8Array;
  this.global.Uint16Array = Uint16Array;
  this.global.Uint32Array = Uint32Array;
  this.global.DataView = DataView;

  // Pass node's Buffer object through
  this.global.Buffer = Buffer;

  // Setup mocked timers
  mockTimers.reset();
  mockTimers.installMockTimers(this.global);

  // I kinda wish tests just did this manually rather than relying on a
  // helper function to do it, but I'm keeping it for backward compat reasons
  // while we get jest deployed internally. Then we can look into removing it.
  //
  // #3376754
  if (!this.global.hasOwnProperty('mockSetReadOnlyProperty')) {
    this.global.mockSetReadOnlyProperty = function(obj, property, value) {
      obj.__defineGetter__(property, function() {
        return value;
      });
    };
  }

  // jsdom doesn't have support for window.Image, so we just replace it with a
  // dummy constructor
  try {
    /* jshint nonew:false */
    new this.global.Image();
  } catch (e) {
    this.global.Image = function Image() {};
  }

  // Pass through the node `process` global.
  // TODO: Consider locking this down somehow so tests can't do crazy stuff to
  //       worker processes...
  this.global.process = process;
}

JSDomEnvironment.prototype.dispose = function() {
  this.global.close();
};

JSDomEnvironment.prototype.runSourceText = function(sourceText, fileName) {
  return this.global.run(sourceText, fileName);
};

module.exports = JSDomEnvironment;
