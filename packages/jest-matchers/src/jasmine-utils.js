/*
Copyright (c) 2008-2016 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* eslint-disable */

'use strict';

const prettyFormat = require('pretty-format');

// Extracted out of jasmine 2.5.2
function equals(a, b, customTesters) {
  customTesters = customTesters || [];
  return eq(a, b, [], [], customTesters);
}

function contains(haystack, needle, customTesters) {
  customTesters = customTesters || [];

  if ((Object.prototype.toString.apply(haystack) === '[object Array]') ||
    (!!haystack && !haystack.indexOf))
  {
    for (var i = 0; i < haystack.length; i++) {
      if (eq(haystack[i], needle, [], [], customTesters)) {
        return true;
      }
    }
    return false;
  }

  return !!haystack && haystack.indexOf(needle) >= 0;
}

function isAsymmetric(obj) {
  return obj && isA('Function', obj.asymmetricMatch);
}

function asymmetricMatch(a, b) {
  var asymmetricA = isAsymmetric(a),
      asymmetricB = isAsymmetric(b);

  if (asymmetricA && asymmetricB) {
    return undefined;
  }

  if (asymmetricA) {
    return a.asymmetricMatch(b);
  }

  if (asymmetricB) {
    return b.asymmetricMatch(a);
  }
}

// Equality function lovingly adapted from isEqual in
//   [Underscore](http://underscorejs.org)
function eq(a, b, aStack, bStack, customTesters) {
  var result = true;

  var asymmetricResult = asymmetricMatch(a, b);
  if (!isUndefined(asymmetricResult)) {
    return asymmetricResult;
  }

  for (var i = 0; i < customTesters.length; i++) {
    var customTesterResult = customTesters[i](a, b);
    if (!isUndefined(customTesterResult)) {
      return customTesterResult;
    }
  }

  if (a instanceof Error && b instanceof Error) {
    return a.message == b.message;
  }

  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
  if (a === b) { return a !== 0 || 1 / a == 1 / b; }
  // A strict comparison is necessary because `null == undefined`.
  if (a === null || b === null) { return a === b; }
  var className = Object.prototype.toString.call(a);
  if (className != Object.prototype.toString.call(b)) { return false; }
  switch (className) {
    // Strings, numbers, dates, and booleans are compared by value.
    case '[object String]':
      // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
      // equivalent to `new String("5")`.
      return a == String(b);
    case '[object Number]':
      // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
      // other numeric values.
      return a != +a ? b != +b : (a === 0 ? 1 / a == 1 / b : a == +b);
    case '[object Date]':
    case '[object Boolean]':
      // Coerce dates and booleans to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a == +b;
    // RegExps are compared by their source patterns and flags.
    case '[object RegExp]':
      return a.source == b.source &&
        a.global == b.global &&
        a.multiline == b.multiline &&
        a.ignoreCase == b.ignoreCase;
  }
  if (typeof a != 'object' || typeof b != 'object') { return false; }

  var aIsDomNode = isDomNode(a);
  var bIsDomNode = isDomNode(b);
  if (aIsDomNode && bIsDomNode) {
    // At first try to use DOM3 method isEqualNode
    if (a.isEqualNode) {
      return a.isEqualNode(b);
    }
    // IE8 doesn't support isEqualNode, try to use outerHTML && innerText
    var aIsElement = a instanceof Element;
    var bIsElement = b instanceof Element;
    if (aIsElement && bIsElement) {
      return a.outerHTML == b.outerHTML;
    }
    if (aIsElement || bIsElement) {
      return false;
    }
    return a.innerText == b.innerText && a.textContent == b.textContent;
  }
  if (aIsDomNode || bIsDomNode) {
    return false;
  }

  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
  var length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (aStack[length] == a) { return bStack[length] == b; }
  }
  // Add the first object to the stack of traversed objects.
  aStack.push(a);
  bStack.push(b);
  var size = 0;
  // Recursively compare objects and arrays.
  // Compare array lengths to determine if a deep comparison is necessary.
  if (className == '[object Array]') {
    size = a.length;
    if (size !== b.length) {
      return false;
    }

    while (size--) {
      result = eq(a[size], b[size], aStack, bStack, customTesters);
      if (!result) {
        return false;
      }
    }
  } else {

    // Objects with different constructors are not equivalent, but `Object`s
    // or `Array`s from different frames are.
    // CUSTOM JEST CHANGE:
    // TODO(cpojer): fix all tests and this and re-enable this check
    /*
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor &&
           isFunction(bCtor) && bCtor instanceof bCtor)) {
      return false;
    }
    */
  }

  // Deep compare objects.
  var aKeys = keys(a, className == '[object Array]'), key;
  size = aKeys.length;

  // Ensure that both objects contain the same number of properties before comparing deep equality.
  if (keys(b, className == '[object Array]').length !== size) { return false; }

  while (size--) {
    key = aKeys[size];

    // Deep compare each member
    result = has(b, key) && eq(a[key], b[key], aStack, bStack, customTesters);

    if (!result) {
      return false;
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop();
  bStack.pop();

  return result;
}

function keys(obj, isArray) {
  // CUSTOM JEST CHANGE: don't consider undefined keys.
  var allKeys = (function(o) {
      var keys = [];
      for (var key in o) {
          if (has(o, key)) {
              keys.push(key);
          }
      }
      return keys;
  })(obj);

  if (!isArray) {
    return allKeys;
  }

  var extraKeys = [];
  if (allKeys.length === 0) {
      return allKeys;
  }

  for (var x = 0; x < allKeys.length; x++) {
      if (!allKeys[x].match(/^[0-9]+$/)) {
          extraKeys.push(allKeys[x]);
      }
  }

  return extraKeys;
}

function has(obj, key) {
  // CUSTOM JEST CHANGE:
  // TODO(cpojer): remove the `obj[key] !== undefined` check.
  return Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined;
}

function isFunction(obj) {
  return typeof obj === 'function';
}

function isObjectConstructor(ctor) {
  // aCtor instanceof aCtor is true for the Object and Function
  // constructors (since a constructor is-a Function and a function is-a
  // Object). We don't just compare ctor === Object because the constructor
  // might come from a different frame with different globals.
  return isFunction(ctor) && ctor instanceof ctor;
}

function isUndefined(obj) {
  return obj === void 0;
}

function isA(typeName, value) {
  return Object.prototype.toString.apply(value) === '[object ' + typeName + ']';
}

function isDomNode(obj) {
  return obj.nodeType > 0;
}

function fnNameFor(func) {
  if (func.name) {
    return func.name;
  }

  var matches = func.toString().match(/^\s*function\s*(\w*)\s*\(/);
  return matches ? matches[1] : '<anonymous>';
}


function Any(expectedObject) {
  if (typeof expectedObject === 'undefined') {
    throw new TypeError(
      'jasmine.any() expects to be passed a constructor function. ' +
      'Please pass one or use jasmine.anything() to match any object.'
    );
  }
  this.expectedObject = expectedObject;
}

function any(expectedObject) {
  return new Any(expectedObject);
}

Any.prototype.asymmetricMatch = function(other) {
  if (this.expectedObject == String) {
    return typeof other == 'string' || other instanceof String;
  }

  if (this.expectedObject == Number) {
    return typeof other == 'number' || other instanceof Number;
  }

  if (this.expectedObject == Function) {
    return typeof other == 'function' || other instanceof Function;
  }

  if (this.expectedObject == Object) {
    return typeof other == 'object';
  }

  if (this.expectedObject == Boolean) {
    return typeof other == 'boolean';
  }

  return other instanceof this.expectedObject;
};

Any.prototype.jasmineToString = function() {
  return '<jasmine.any(' + fnNameFor(this.expectedObject) + ')>';
};


function Anything() {}

function anything() {
  return new Anything();
}

Anything.prototype.asymmetricMatch = function(other) {
  return !isUndefined(other) && other !== null;
};

Anything.prototype.jasmineToString = function() {
  return '<jasmine.anything>';
};


function ArrayContaining(sample) {
  this.sample = sample;
}

function arrayContaining(sample) {
  return new ArrayContaining(sample);
}

ArrayContaining.prototype.asymmetricMatch = function(other) {
  var className = Object.prototype.toString.call(this.sample);
  if (className !== '[object Array]') { throw new Error('You must provide an array to arrayContaining, not \'' + this.sample + '\'.'); }

  for (var i = 0; i < this.sample.length; i++) {
    var item = this.sample[i];
    if (!contains(other, item)) {
      return false;
    }
  }

  return true;
};

ArrayContaining.prototype.jasmineToString = function () {
  return '<jasmine.arrayContaining(' + prettyFormat(this.sample) +')>';
};


function ObjectContaining(sample) {
  this.sample = sample;
}

function objectContaining(sample) {
  return new ObjectContaining(sample);
}

function getPrototype(obj) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(obj);
  }

  if (obj.constructor.prototype == obj) {
    return null;
  }

  return obj.constructor.prototype;
}

function hasProperty(obj, property) {
  if (!obj) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(obj, property)) {
    return true;
  }

  return hasProperty(getPrototype(obj), property);
}

ObjectContaining.prototype.asymmetricMatch = function(other) {
  if (typeof(this.sample) !== 'object') { throw new Error('You must provide an object to objectContaining, not \''+this.sample+'\'.'); }

  for (var property in this.sample) {
    if (!hasProperty(other, property) ||
        !equals(this.sample[property], other[property])) {
      return false;
    }
  }

  return true;
};

ObjectContaining.prototype.jasmineToString = function() {
  return '<jasmine.objectContaining(' + prettyFormat(this.sample) + ')>';
};


function StringMatching(expected) {
  if (!isA('String', expected) && !isA('RegExp', expected)) {
    throw new Error('Expected is not a String or a RegExp');
  }

  this.regexp = new RegExp(expected);
}

function stringMatching(expected) {
  return new StringMatching(expected);
}

StringMatching.prototype.asymmetricMatch = function(other) {
  return this.regexp.test(other);
};

StringMatching.prototype.jasmineToString = function() {
  return '<jasmine.stringMatching(' + this.regexp + ')>';
};

module.exports = {
  any,
  anything,
  arrayContaining,
  equals,
  objectContaining,
  stringMatching,
};
