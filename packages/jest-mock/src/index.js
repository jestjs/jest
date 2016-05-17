/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const RESERVED_KEYWORDS = [
  'do',
  'if',
  'in',
  'for',
  'let',
  'new',
  'try',
  'var',
  'case',
  'else',
  'enum',
  'eval',
  'null',
  'this',
  'true',
  'void',
  'with',
  'await',
  'break',
  'catch',
  'class',
  'const',
  'false',
  'super',
  'throw',
  'while',
  'yield',
  'delete',
  'export',
  'import',
  'public',
  'return',
  'static',
  'switch',
  'typeof',
  'default',
  'extends',
  'finally',
  'package',
  'private',
  'continue',
  'debugger',
  'function',
  'arguments',
  'interface',
  'protected',
  'implements',
  'instanceof',
];

function isA(typeName, value) {
  return Object.prototype.toString.apply(value) === '[object ' + typeName + ']';
}

function getType(ref) {
  if (isA('Function', ref)) {
    return 'function';
  } else if (Array.isArray(ref)) {
    return 'array';
  } else if (isA('Object', ref)) {
    return 'object';
  } else if (isA('Number', ref) || isA('String', ref) || isA('Boolean', ref)) {
    return 'constant';
  } else if (isA('Map', ref) || isA('WeakMap', ref) || isA('Set', ref)) {
    return 'collection';
  } else if (isA('RegExp', ref)) {
    return 'regexp';
  } else if (ref === undefined) {
    return 'undefined';
  } else if (ref === null) {
    return 'null';
  } else {
    return null;
  }
}

function isReadonlyProp(object, prop) {
  return (
    (
      (
        prop === 'arguments' ||
        prop === 'caller' ||
        prop === 'callee' ||
        prop === 'name' ||
        prop === 'length'
      ) &&
      isA('Function', object)
    ) ||
    (
      (
        prop === 'source' ||
        prop === 'global' ||
        prop === 'ignoreCase' ||
        prop === 'multiline'
      ) &&
      isA('RegExp', object)
    )
  );
}

function getSlots(object) {
  const slots = {};
  if (!object) {
    return [];
  }

  let parent = Object.getPrototypeOf(object);
  do {
    if (object === Function.prototype) {
      break;
    }
    const ownNames = Object.getOwnPropertyNames(object);
    for (let i = 0; i < ownNames.length; i++) {
      const prop = ownNames[i];
      if (!isReadonlyProp(object, prop)) {
        const propDesc = Object.getOwnPropertyDescriptor(object, prop);
        if (!propDesc.get) {
          slots[prop] = true;
        }
      }
    }
    object = parent;
  } while (object && (parent = Object.getPrototypeOf(object)) !== null);
  return Object.keys(slots);
}

function createMockFunction(metadata, mockConstructor) {
  let name = metadata.name;
  if (!name) {
    return mockConstructor;
  }

  // Preserve `name` property of mocked function.
  const boundFunctionPrefix = 'bound ';
  let bindCall = '';
  // if-do-while for perf reasons. The common case is for the if to fail.
  if (name && name.startsWith(boundFunctionPrefix)) {
    do {
      name = name.substring(boundFunctionPrefix.length);
      // Call bind() just to alter the function name.
      bindCall = '.bind(null)';
    } while (name && name.startsWith(boundFunctionPrefix));
  }

  // It's a syntax error to define functions with a reserved keyword
  // as name.
  if (RESERVED_KEYWORDS.indexOf(name) !== -1) {
    name = '$' + name;
  }

  /* eslint-disable no-new-func */
  return new Function(
    'mockConstructor',
    'return function ' + name + '() {' +
      'return mockConstructor.apply(this,arguments);' +
    '}' + bindCall
  )(mockConstructor);
  /* eslint-enable no-new-func */
}

function makeComponent(metadata) {
  if (metadata.type === 'object') {
    return {};
  } else if (metadata.type === 'array') {
    return [];
  } else if (metadata.type === 'regexp') {
    return new RegExp();
  } else if (
    metadata.type === 'constant' ||
    metadata.type === 'collection' ||
    metadata.type === 'null' ||
    metadata.type === 'undefined'
  ) {
    return metadata.value;
  } else if (metadata.type === 'function') {
    let isReturnValueLastSet = false;
    let defaultReturnValue;
    let mockImpl;
    let f;
    const specificReturnValues = [];
    const specificMockImpls = [];
    const calls = [];
    const instances = [];
    const prototype = (
      metadata.members &&
      metadata.members.prototype &&
      metadata.members.prototype.members
    ) || {};
    const prototypeSlots = getSlots(prototype);
    const mockConstructor = function() {
      instances.push(this);
      calls.push(Array.prototype.slice.call(arguments));
      if (this instanceof f) {
        // This is probably being called as a constructor
        prototypeSlots.forEach(slot => {
          // Copy prototype methods to the instance to make
          // it easier to interact with mock instance call and
          // return values
          if (prototype[slot].type === 'function') {
            const protoImpl = this[slot];
            this[slot] = generateFromMetadata(prototype[slot]);
            this[slot]._protoImpl = protoImpl;
          }
        });

        // Run the mock constructor implementation
        return mockImpl && mockImpl.apply(this, arguments);
      }

      let returnValue;
      // If return value is last set, either specific or default, i.e.
      // mockReturnValueOnce()/mockReturnValue() is called and no
      // mockImplementationOnce()/mockImplementation() is called after that.
      // use the set return value.
      if (isReturnValueLastSet) {
        returnValue = specificReturnValues.shift();
        if (returnValue === undefined) {
          returnValue = defaultReturnValue;
        }
      }

      // If mockImplementationOnce()/mockImplementation() is last set,
      // or specific return values are used up, use the mock implementation.
      let specificMockImpl;
      if (returnValue === undefined) {
        specificMockImpl = specificMockImpls.shift();
        if (specificMockImpl === undefined) {
          specificMockImpl = mockImpl;
        }
        if (specificMockImpl) {
          return specificMockImpl.apply(this, arguments);
        }
      }

      // Otherwise use prototype implementation
      if (returnValue === undefined && f._protoImpl) {
        return f._protoImpl.apply(this, arguments);
      }

      return returnValue;
    };

    f = createMockFunction(metadata, mockConstructor);
    f._isMockFunction = true;
    f._getMockImplementation = () => mockImpl;
    f.mock = {calls, instances};

    f.mockClear = () => {
      calls.length = 0;
      instances.length = 0;
    };

    f.mockReturnValueOnce = value => {
      // next function call will return this value or default return value
      isReturnValueLastSet = true;
      specificReturnValues.push(value);
      return f;
    };

    f.mockReturnValue = value => {
      // next function call will return specified return value or this one
      isReturnValueLastSet = true;
      defaultReturnValue = value;
      return f;
    };

    f.mockImplementationOnce = fn => {
      // next function call will use this mock implementation return value
      // or default mock implementation return value
      isReturnValueLastSet = false;
      specificMockImpls.push(fn);
      return f;
    };

    f.mockImplementation = f.mockImpl = fn => {
      // next function call will use mock implementation return value
      isReturnValueLastSet = false;
      mockImpl = fn;
      return f;
    };

    f.mockReturnThis = () =>
      f.mockImplementation(function() {
        return this;
      });

    if (metadata.mockImpl) {
      f.mockImplementation(metadata.mockImpl);
    }

    return f;
  } else {
    throw new Error('Unrecognized type ' + metadata.type);
  }
}

function generateMock(metadata, callbacks, refs) {
  const mock = makeComponent(metadata);
  if (metadata.refID != null) {
    refs[metadata.refID] = mock;
  }

  getSlots(metadata.members).forEach(slot => {
    const slotMetadata = metadata.members[slot];
    if (slotMetadata.ref != null) {
      callbacks.push(() => mock[slot] = refs[slotMetadata.ref]);
    } else {
      mock[slot] = generateMock(slotMetadata, callbacks, refs);
    }
  });

  if (
    metadata.type !== 'undefined' &&
    metadata.type !== 'null' &&
    mock.prototype
  ) {
    mock.prototype.constructor = mock;
  }

  return mock;
}

function generateFromMetadata(_metadata) {
  const callbacks = [];
  const refs = {};
  const mock = generateMock(_metadata, callbacks, refs);
  callbacks.forEach(setter => setter());
  return mock;
}

function getMetadata(component, _refs) {
  const refs = _refs || new Map();
  const ref = refs.get(component);
  if (ref != null) {
    return {ref};
  }

  const type = getType(component);
  if (!type) {
    return null;
  }

  const metadata = {type};
  if (
    type === 'constant' ||
    type === 'collection' ||
    type === 'undefined' ||
    type === 'null'
  ) {
    metadata.value = component;
    return metadata;
  } else if (type === 'function') {
    metadata.name = component.name;
    if (component._isMockFunction) {
      metadata.mockImpl = component._getMockImplementation();
    }
  }

  metadata.refID = refs.size;
  refs.set(component, metadata.refID);

  let members = null;
  // Leave arrays alone
  if (type !== 'array') {
    if (type !== 'undefined') {
      getSlots(component).forEach(slot => {
        if (
          type === 'function' &&
          component._isMockFunction &&
          slot.match(/^mock/)
        ) {
          return;
        }

        if (
          (!component.hasOwnProperty && component[slot] !== undefined) ||
          (component.hasOwnProperty && component.hasOwnProperty(slot)) ||
          (type === 'object' && component[slot] != Object.prototype[slot])
        ) {
          const slotMetadata = getMetadata(component[slot], refs);
          if (slotMetadata) {
            if (!members) {
              members = {};
            }
            members[slot] = slotMetadata;
          }
        }
      });
    }

    // If component is native code function, prototype might be undefined
    if (type === 'function' && component.prototype) {
      const prototype = getMetadata(component.prototype, refs);
      if (prototype && prototype.members) {
        if (!members) {
          members = {};
        }
        members.prototype = prototype;
      }
    }
  }

  if (members) {
    metadata.members = members;
  }

  return metadata;
}

module.exports = {
  /**
   * @see README.md
   * @param metadata Metadata for the mock in the schema returned by the
   * getMetadata method of this module.
   */
  generateFromMetadata,

  /**
   * @see README.md
   * @param component The component for which to retrieve metadata.
   */
  getMetadata,

  /**
   * @see README.md
   */
  getMockFunction() {
    return makeComponent({type: 'function'});
  },

  // Just a short-hand alias
  getMockFn() {
    return this.getMockFunction();
  },
};
