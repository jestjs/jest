var jsdom = require('./lib/jsdom-compat').jsdom;
var mockTimers = require('./lib/mockTimers');
var TestEnvironment = require('./TestEnvironment');
var utils = require('./lib/utils');

function jsdomEnvironmentBuilder() {
  var jsdomWindow = jsdom().parentWindow;

  // Stuff jsdom doesn't support out of the box
  jsdomWindow.location.host = jsdomWindow.location.hostname = '';
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

  // Pass through the node `process` global.
  // TODO: Consider locking this down somehow so tests can't do crazy stuff to
  //       worker processes...
  jsdomWindow.process = process;

  return new TestEnvironment(jsdomWindow, jsdomWindow.run);
}

module.exports = jsdomEnvironmentBuilder;
