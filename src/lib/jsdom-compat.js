/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * This file contains various hacks and tweaks that were necessary at some
 * point to get jsdom to behave correctly.
 *
 * TODO(benjamn) Periodically purge unnecessary stuff from this file
 * and/or create upstream pull requests for obvious bugs.
 */

// If this require starts failing in the future, it might be because
// cssstyle has matured enough that the hacks below are no longer
// necessary, so don't panic.
try {
  var cssPropertyParsers = require('cssstyle/lib/parsers');
} catch (err) {
  // This error probably just means cssstyle is not installed yet, because
  // we're still in the process of upgrading jsdom. Don't worry about it
  // until jsdom has been updated to the latest version (v0.8.x).
}

if (cssPropertyParsers) {
  // The shorthandParser function should never return a string, but it
  // does when given an empty string. Here we detect that case and make it
  // return an empty object instead, to work around bugs in later code
  // that assume the result of shorthandParser is always an object.
  var shorthandParser = cssPropertyParsers.shorthandParser;
  cssPropertyParsers.shorthandParser = function() {
    var result = shorthandParser.apply(this, arguments);
    return result === '' ? {} : result;
  };

  // Current versions of the cssstyle parseInteger function can't actually
  // handle string inputs.
  var badInt = cssPropertyParsers.parseInteger('5');
  if (badInt !== '5') {
    cssPropertyParsers.parseInteger = function parseInteger(val) {
      return String(parseInt(val, 10));
    };
  }

  // Current versions of the cssstyle parseNumber function can't actually
  // handle string inputs.
  var badNum = cssPropertyParsers.parseNumber('0.5');
  if (badNum !== '0.5') {
    cssPropertyParsers.parseNumber = function parseNumber(val) {
      return String(parseFloat(val, 10));
    };
  }
}

// We can't require jsdom/lib/jsdom/browser/utils directly, because it
// requires jsdom, which requires utils circularly, so the utils module
// won't be fully populated when its (non-existent) NOT_IMPLEMENTED
// property is imported elsewhere. Instead, the only thing that seems to
// work is to override the utils module in require.cache, so that we never
// have to evaluate the original module.
try {
  var utilsId = require.resolve('jsdom/lib/jsdom/browser/utils');
} catch (err) {
  // Leave utilsId undefined if require.resolve couldn't resolve it.
}

if (utilsId) {
  require.cache[utilsId] = {
    id: utilsId,
    exports: {
      NOT_IMPLEMENTED: function(target, nameForErrorMessage) {
        var message = 'NOT IMPLEMENTED' + (
          nameForErrorMessage ? ': ' + nameForErrorMessage : ''
        );

        return function() {
          if (!jsdom.debugMode) {
            // These two lines have been changed from the original
            // NOT_IMPLEMENTED function to be more defensive about the
            // presence/absence of .raise and raise.call.
            var raise = (target && target.raise) || (this && this.raise);
            if (raise && raise.call) {
              raise.call(this, 'error', message);
            } else {
              // In case there was no suitable raise function to use, we
              // still want to throw a meaningful Error (another
              // improvement over the original NOT_IMPLEMENTED).
              throw new Error(message);
            }
          }
        };
      }
    }
  };
}

var jsdom = require('jsdom');
var elements = jsdom.defaultLevel;
if (elements && elements.HTMLInputElement) {
  var proto = elements.HTMLInputElement.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'checked');
  if (desc) {
    // Reimplement the .checked setter to require that two radio buttons
    // have the same .form in order for their .checked values to be
    // mutually exclusive. Except for the lines commented below, this code
    // was borrowed directly from the jsdom implementation:
    // https://github.com/tmpvar/jsdom/blob/0cf670d6eb/lib/jsdom/level2/html.js#L975-L990
    desc.set = function(checked) {
      this._initDefaultChecked();

      // Accept empty strings as truthy values for the .checked attribute.
      if (checked || (checked === '')) {
        this.setAttribute('checked', 'checked');

        if (this.type === 'radio') {
          var elements = this._ownerDocument.getElementsByName(this.name);

          for (var i = 0; i < elements.length; i++) {
            var other = elements[i];
            if (other !== this &&
                other.tagName === 'INPUT' &&
                other.type === 'radio' &&
                // This is the condition that is missing from the default
                // implementation of the .checked setter.
                other.form === this.form) {
              other.checked = false;
            }
          }
        }

      } else {
        this.removeAttribute('checked');
      }
    };

    Object.defineProperty(proto, 'checked', desc);
  }
}

// Make sure we unselect all but the first selected option when a <select>
// element has its "multiple" attribute set to false.
if (elements && elements.HTMLSelectElement) {
  var proto = elements.HTMLSelectElement.prototype;
  var oldAttrModified = proto._attrModified;
  proto._attrModified = function(name, value) {
    if (name === 'multiple' && !value) {
      var leaveNextOptionSelected = true;
      this.options._toArray().forEach(function(option) {
        if (option.selected) {
          if (leaveNextOptionSelected) {
            leaveNextOptionSelected = false;
          } else {
            option.selected = false;
          }
        }
      });
    }

    return oldAttrModified.apply(this, arguments);
  };
}

// Require this module if you want to require('jsdom'), to ensure the
// above compatibility measures have been implemented.
module.exports = jsdom;
