'use strict';

var mockTimers = require('./lib/mockTimers');
var TestEnvironment = require('./TestEnvironment');

function jsdomEnvironmentBuilder() {
  // We lazily require jsdom because it takes a good ~.5s to load.
  //
  // Since this file may be require'd at the top of other files that may/may not
  // use it (depending on the context -- such as TestRunner.js when operating as
  // a workerpool parent), this is the best way to ensure we only spend time
  // require()ing this when necessary.
  var jsdom = require('./lib/jsdom-compat').jsdom;
  var jsdomWindow = jsdom().parentWindow;

  // Stuff jsdom doesn't support out of the box
  Object.defineProperty(jsdomWindow.location, 'hostname', {
    value: ''
  });
  Object.defineProperty(jsdomWindow.location, 'host', {
    value: ''
  });
  jsdomWindow.navigator.onLine = true;
  jsdomWindow.ArrayBuffer = ArrayBuffer;
  jsdomWindow.Float32Array = Float32Array;
  jsdomWindow.Int16Array = Int16Array;
  jsdomWindow.Int32Array = Int32Array;
  jsdomWindow.Int8Array = Int8Array;
  jsdomWindow.Uint8Array = Uint8Array;
  jsdomWindow.Uint16Array = Uint16Array;
  jsdomWindow.Uint32Array = Uint32Array;
  jsdomWindow.DataView = DataView;
  jsdomWindow.Buffer = Buffer;

  mockTimers.reset();
  mockTimers.installMockTimers(jsdomWindow);

  // I kinda wish tests just did this manually rather than relying on a
  // helper function to do it, but I'm keeping it for backward compat reasons
  // while we get jest deployed internally. Then we can look into removing it.
  //
  // #3376754
  if (!jsdomWindow.hasOwnProperty('mockSetReadOnlyProperty')) {
    jsdomWindow.mockSetReadOnlyProperty = function(obj, property, value) {
      obj.__defineGetter__(property, function() {
        return value;
      });
    };
  }

  // jsdom doesn't have support for window.Image, so we just replace it with a
  // dummy constructor
  try {
    /* jshint nonew:false */
    new jsdomWindow.Image();
  } catch (e) {
    jsdomWindow.Image = function Image() {};
  }

  // Pass through the node `process` global.
  // TODO: Consider locking this down somehow so tests can't do crazy stuff to
  //       worker processes...
  jsdomWindow.process = process;

  return new TestEnvironment(jsdomWindow, jsdomWindow.run);
}

module.exports = jsdomEnvironmentBuilder;
