/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Global} from 'types/Global';

type Mock = any;
export type MockFunctionMetadata = {
  ref?: any,
  members?: {[key: string]: MockFunctionMetadata},
  mockImpl?: () => any,
  name?: string,
  refID?: string | number,
  type?: string,
  value?: any,
  length?: number,
};

/**
 * Possible types of a MockFunctionResult.
 * 'return': The call completed by returning normally.
 * 'throw': The call completed by throwing a value.
 * 'incomplete': The call has not completed yet. This is possible if you read
 *               the  mock function result from within the mock function itself
 *               (or a function called by the mock function).
 */
type MockFunctionResultType = 'return' | 'throw' | 'incomplete';

/**
 * Represents the result of a single call to a mock function.
 */
type MockFunctionResult = {
  /**
   * Indicates how the call completed.
   */
  type: MockFunctionResultType,
  /**
   * The value that was either thrown or returned by the function.
   * Undefined when type === 'incomplete'.
   */
  value: any,
};

type MockFunctionState = {
  instances: Array<any>,
  calls: Array<Array<any>>,
  /**
   * List of results of calls to the mock function.
   */
  results: Array<MockFunctionResult>,
  invocationCallOrder: Array<number>,
};

type MockFunctionConfig = {
  isReturnValueLastSet: boolean,
  defaultReturnValue: any,
  mockImpl: any,
  mockName: string,
  specificReturnValues: Array<any>,
  specificMockImpls: Array<any>,
};

const MOCK_CONSTRUCTOR_NAME = 'mockConstructor';

const FUNCTION_NAME_RESERVED_PATTERN = /[\s!-\/:-@\[-`{-~]/;
const FUNCTION_NAME_RESERVED_REPLACE = new RegExp(
  FUNCTION_NAME_RESERVED_PATTERN.source,
  'g',
);

const RESERVED_KEYWORDS = Object.assign(Object.create(null), {
  arguments: true,
  await: true,
  break: true,
  case: true,
  catch: true,
  class: true,
  const: true,
  continue: true,
  debugger: true,
  default: true,
  delete: true,
  do: true,
  else: true,
  enum: true,
  eval: true,
  export: true,
  extends: true,
  false: true,
  finally: true,
  for: true,
  function: true,
  if: true,
  implements: true,
  import: true,
  in: true,
  instanceof: true,
  interface: true,
  let: true,
  new: true,
  null: true,
  package: true,
  private: true,
  protected: true,
  public: true,
  return: true,
  static: true,
  super: true,
  switch: true,
  this: true,
  throw: true,
  true: true,
  try: true,
  typeof: true,
  var: true,
  void: true,
  while: true,
  with: true,
  yield: true,
});

function matchArity(fn: any, length: number): any {
  let mockConstructor;

  switch (length) {
    case 1:
      mockConstructor = function(a) {
        return fn.apply(this, arguments);
      };
      break;
    case 2:
      mockConstructor = function(a, b) {
        return fn.apply(this, arguments);
      };
      break;
    case 3:
      mockConstructor = function(a, b, c) {
        return fn.apply(this, arguments);
      };
      break;
    case 4:
      mockConstructor = function(a, b, c, d) {
        return fn.apply(this, arguments);
      };
      break;
    case 5:
      mockConstructor = function(a, b, c, d, e) {
        return fn.apply(this, arguments);
      };
      break;
    case 6:
      mockConstructor = function(a, b, c, d, e, f) {
        return fn.apply(this, arguments);
      };
      break;
    case 7:
      mockConstructor = function(a, b, c, d, e, f, g) {
        return fn.apply(this, arguments);
      };
      break;
    case 8:
      mockConstructor = function(a, b, c, d, e, f, g, h) {
        return fn.apply(this, arguments);
      };
      break;
    case 9:
      mockConstructor = function(a, b, c, d, e, f, g, h, i) {
        return fn.apply(this, arguments);
      };
      break;
    default:
      mockConstructor = function() {
        return fn.apply(this, arguments);
      };
      break;
  }

  return mockConstructor;
}

function getObjectType(value: any): string {
  return Object.prototype.toString.apply(value).slice(8, -1);
}

function getType(ref?: any): string | null {
  const typeName = getObjectType(ref);
  if (
    typeName === 'Function' ||
    typeName === 'AsyncFunction' ||
    typeName === 'GeneratorFunction'
  ) {
    return 'function';
  } else if (Array.isArray(ref)) {
    return 'array';
  } else if (typeName === 'Object') {
    return 'object';
  } else if (
    typeName === 'Number' ||
    typeName === 'String' ||
    typeName === 'Boolean' ||
    typeName === 'Symbol'
  ) {
    return 'constant';
  } else if (
    typeName === 'Map' ||
    typeName === 'WeakMap' ||
    typeName === 'Set'
  ) {
    return 'collection';
  } else if (typeName === 'RegExp') {
    return 'regexp';
  } else if (ref === undefined) {
    return 'undefined';
  } else if (ref === null) {
    return 'null';
  } else {
    return null;
  }
}

function isReadonlyProp(object: any, prop: string): boolean {
  if (
    prop === 'arguments' ||
    prop === 'caller' ||
    prop === 'callee' ||
    prop === 'name' ||
    prop === 'length'
  ) {
    const typeName = getObjectType(object);
    return (
      typeName === 'Function' ||
      typeName === 'AsyncFunction' ||
      typeName === 'GeneratorFunction'
    );
  }

  if (
    prop === 'source' ||
    prop === 'global' ||
    prop === 'ignoreCase' ||
    prop === 'multiline'
  ) {
    return getObjectType(object) === 'RegExp';
  }

  return false;
}

class ModuleMockerClass {
  _environmentGlobal: Global;
  _mockState: WeakMap<Function, MockFunctionState>;
  _mockConfigRegistry: WeakMap<Function, MockFunctionConfig>;
  _spyState: Set<() => void>;
  ModuleMocker: Class<ModuleMockerClass>;
  _invocationCallCounter: number;

  /**
   * @see README.md
   * @param global Global object of the test environment, used to create
   * mocks
   */
  constructor(global: Global) {
    this._environmentGlobal = global;
    this._mockState = new WeakMap();
    this._mockConfigRegistry = new WeakMap();
    this._spyState = new Set();
    this.ModuleMocker = ModuleMockerClass;
    this._invocationCallCounter = 1;
  }

  _getSlots(object?: Object): Array<string> {
    if (!object) {
      return [];
    }

    const slots = new Set();
    const EnvObjectProto = this._environmentGlobal.Object.prototype;
    const EnvFunctionProto = this._environmentGlobal.Function.prototype;
    const EnvRegExpProto = this._environmentGlobal.RegExp.prototype;

    // Also check the builtins in the current context as they leak through
    // core node modules.
    const ObjectProto = Object.prototype;
    const FunctionProto = Function.prototype;
    const RegExpProto = RegExp.prototype;

    // Properties of Object.prototype, Function.prototype and RegExp.prototype
    // are never reported as slots
    while (
      object != null &&
      object !== EnvObjectProto &&
      object !== EnvFunctionProto &&
      object !== EnvRegExpProto &&
      object !== ObjectProto &&
      object !== FunctionProto &&
      object !== RegExpProto
    ) {
      const ownNames = Object.getOwnPropertyNames(object);

      for (let i = 0; i < ownNames.length; i++) {
        const prop = ownNames[i];

        if (!isReadonlyProp(object, prop)) {
          const propDesc = Object.getOwnPropertyDescriptor(object, prop);

          if ((propDesc !== undefined && !propDesc.get) || object.__esModule) {
            slots.add(prop);
          }
        }
      }

      object = Object.getPrototypeOf(object);
    }

    return Array.from(slots);
  }

  _ensureMockConfig(f: Mock): MockFunctionConfig {
    let config = this._mockConfigRegistry.get(f);
    if (!config) {
      config = this._defaultMockConfig();
      this._mockConfigRegistry.set(f, config);
    }
    return config;
  }

  _ensureMockState(f: Mock): MockFunctionState {
    let state = this._mockState.get(f);
    if (!state) {
      state = this._defaultMockState();
      this._mockState.set(f, state);
    }
    return state;
  }

  _defaultMockConfig(): MockFunctionConfig {
    return {
      defaultReturnValue: undefined,
      isReturnValueLastSet: false,
      mockImpl: undefined,
      mockName: 'jest.fn()',
      specificMockImpls: [],
      specificReturnValues: [],
    };
  }

  _defaultMockState(): MockFunctionState {
    return {
      calls: [],
      instances: [],
      invocationCallOrder: [],
      results: [],
    };
  }

  _makeComponent(metadata: MockFunctionMetadata, restore?: () => void): Mock {
    if (metadata.type === 'object') {
      return new this._environmentGlobal.Object();
    } else if (metadata.type === 'array') {
      return new this._environmentGlobal.Array();
    } else if (metadata.type === 'regexp') {
      return new this._environmentGlobal.RegExp('');
    } else if (
      metadata.type === 'constant' ||
      metadata.type === 'collection' ||
      metadata.type === 'null' ||
      metadata.type === 'undefined'
    ) {
      return metadata.value;
    } else if (metadata.type === 'function') {
      /* eslint-disable prefer-const */
      let f;
      /* eslint-enable prefer-const */

      const prototype =
        (metadata.members &&
          metadata.members.prototype &&
          metadata.members.prototype.members) ||
        {};
      const prototypeSlots = this._getSlots(prototype);
      const mocker = this;
      const mockConstructor = matchArity(function() {
        const mockState = mocker._ensureMockState(f);
        const mockConfig = mocker._ensureMockConfig(f);
        mockState.instances.push(this);
        mockState.calls.push(Array.prototype.slice.call(arguments));
        // Create and record an "incomplete" mock result immediately upon
        // calling rather than waiting for the mock to return. This avoids
        // issues caused by recursion where results can be recorded in the
        // wrong order.
        const mockResult = {
          type: 'incomplete',
          value: undefined,
        };
        mockState.results.push(mockResult);
        mockState.invocationCallOrder.push(mocker._invocationCallCounter++);

        // Will be set to the return value of the mock if an error is not thrown
        let finalReturnValue;
        // Will be set to the error that is thrown by the mock (if it throws)
        let thrownError;
        // Will be set to true if the mock throws an error. The presence of a
        // value in `thrownError` is not a 100% reliable indicator because a
        // function could throw a value of undefined.
        let callDidThrowError = false;

        try {
          // The bulk of the implementation is wrapped in an immediately
          // executed arrow function so the return value of the mock function
          // can be easily captured and recorded, despite the many separate
          // return points within the logic.
          finalReturnValue = (() => {
            if (this instanceof f) {
              // This is probably being called as a constructor
              prototypeSlots.forEach(slot => {
                // Copy prototype methods to the instance to make
                // it easier to interact with mock instance call and
                // return values
                if (prototype[slot].type === 'function') {
                  const protoImpl = this[slot];
                  this[slot] = mocker.generateFromMetadata(prototype[slot]);
                  this[slot]._protoImpl = protoImpl;
                }
              });

              // Run the mock constructor implementation
              const mockImpl = mockConfig.specificMockImpls.length
                ? mockConfig.specificMockImpls.shift()
                : mockConfig.mockImpl;
              return mockImpl && mockImpl.apply(this, arguments);
            }

            const returnValue = mockConfig.defaultReturnValue;
            // If return value is last set, either specific or default, i.e.
            // mockReturnValueOnce()/mockReturnValue() is called and no
            // mockImplementationOnce()/mockImplementation() is called after
            // that.
            // use the set return value.
            if (mockConfig.specificReturnValues.length) {
              return mockConfig.specificReturnValues.shift();
            }

            if (mockConfig.isReturnValueLastSet) {
              return mockConfig.defaultReturnValue;
            }

            // If mockImplementationOnce()/mockImplementation() is last set,
            // or specific return values are used up, use the mock
            // implementation.
            let specificMockImpl;
            if (returnValue === undefined) {
              specificMockImpl = mockConfig.specificMockImpls.shift();
              if (specificMockImpl === undefined) {
                specificMockImpl = mockConfig.mockImpl;
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
          })();
        } catch (error) {
          // Store the thrown error so we can record it, then re-throw it.
          thrownError = error;
          callDidThrowError = true;
          throw error;
        } finally {
          // Record the result of the function.
          // NOTE: Intentionally NOT pushing/indexing into the array of mock
          //       results here to avoid corrupting results data if mockClear()
          //       is called during the execution of the mock.
          mockResult.type = callDidThrowError ? 'throw' : 'return';
          mockResult.value = callDidThrowError ? thrownError : finalReturnValue;
        }

        return finalReturnValue;
      }, metadata.length || 0);

      f = this._createMockFunction(metadata, mockConstructor);
      f._isMockFunction = true;
      f.getMockImplementation = () => this._ensureMockConfig(f).mockImpl;

      if (typeof restore === 'function') {
        this._spyState.add(restore);
      }

      this._mockState.set(f, this._defaultMockState());
      this._mockConfigRegistry.set(f, this._defaultMockConfig());

      // $FlowFixMe - defineProperty getters not supported
      Object.defineProperty(f, 'mock', {
        configurable: false,
        enumerable: true,
        get: () => this._ensureMockState(f),
        set: val => this._mockState.set(f, val),
      });

      f.mockClear = () => {
        this._mockState.delete(f);
        return f;
      };

      f.mockReset = () => {
        f.mockClear();
        this._mockConfigRegistry.delete(f);
        return f;
      };

      f.mockRestore = () => {
        f.mockReset();
        return restore ? restore() : undefined;
      };

      f.mockReturnValueOnce = value => {
        // next function call will return this value or default return value
        const mockConfig = this._ensureMockConfig(f);
        mockConfig.specificReturnValues.push(value);
        return f;
      };

      f.mockResolvedValueOnce = value =>
        f.mockImplementationOnce(() => Promise.resolve(value));

      f.mockRejectedValueOnce = value =>
        f.mockImplementationOnce(() => Promise.reject(value));

      f.mockReturnValue = value => {
        // next function call will return specified return value or this one
        const mockConfig = this._ensureMockConfig(f);
        mockConfig.isReturnValueLastSet = true;
        mockConfig.defaultReturnValue = value;
        return f;
      };

      f.mockResolvedValue = value =>
        f.mockImplementation(() => Promise.resolve(value));

      f.mockRejectedValue = value =>
        f.mockImplementation(() => Promise.reject(value));

      f.mockImplementationOnce = fn => {
        // next function call will use this mock implementation return value
        // or default mock implementation return value
        const mockConfig = this._ensureMockConfig(f);
        mockConfig.isReturnValueLastSet = false;
        mockConfig.specificMockImpls.push(fn);
        return f;
      };

      f.mockImplementation = fn => {
        // next function call will use mock implementation return value
        const mockConfig = this._ensureMockConfig(f);
        mockConfig.isReturnValueLastSet = false;
        mockConfig.defaultReturnValue = undefined;
        mockConfig.mockImpl = fn;
        return f;
      };

      f.mockReturnThis = () =>
        f.mockImplementation(function() {
          return this;
        });

      f.mockName = name => {
        if (name) {
          const mockConfig = this._ensureMockConfig(f);
          mockConfig.mockName = name;
        }
        return f;
      };

      f.getMockName = () => {
        const mockConfig = this._ensureMockConfig(f);
        return mockConfig.mockName || 'jest.fn()';
      };

      if (metadata.mockImpl) {
        f.mockImplementation(metadata.mockImpl);
      }

      return f;
    } else {
      const unknownType = metadata.type || 'undefined type';
      throw new Error('Unrecognized type ' + unknownType);
    }
  }

  _createMockFunction(
    metadata: MockFunctionMetadata,
    mockConstructor: () => any,
  ): any {
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

    // Special case functions named `mockConstructor` to guard for infinite
    // loops.
    if (name === MOCK_CONSTRUCTOR_NAME) {
      return mockConstructor;
    }

    // It's a syntax error to define functions with a reserved keyword
    // as name.
    if (RESERVED_KEYWORDS[name]) {
      name = '$' + name;
    }

    // It's also a syntax error to define a function with a reserved character
    // as part of it's name.
    if (FUNCTION_NAME_RESERVED_PATTERN.test(name)) {
      name = name.replace(FUNCTION_NAME_RESERVED_REPLACE, '$');
    }

    const body =
      'return function ' +
      name +
      '() {' +
      'return ' +
      MOCK_CONSTRUCTOR_NAME +
      '.apply(this,arguments);' +
      '}' +
      bindCall;
    const createConstructor = new this._environmentGlobal.Function(
      MOCK_CONSTRUCTOR_NAME,
      body,
    );

    return createConstructor(mockConstructor);
  }

  _generateMock(
    metadata: MockFunctionMetadata,
    callbacks: Array<() => any>,
    refs: Object,
  ): Mock {
    const mock = this._makeComponent(metadata);
    if (metadata.refID != null) {
      refs[metadata.refID] = mock;
    }

    this._getSlots(metadata.members).forEach(slot => {
      const slotMetadata = (metadata.members && metadata.members[slot]) || {};
      if (slotMetadata.ref != null) {
        callbacks.push(() => (mock[slot] = refs[slotMetadata.ref]));
      } else {
        mock[slot] = this._generateMock(slotMetadata, callbacks, refs);
      }
    });

    if (
      metadata.type !== 'undefined' &&
      metadata.type !== 'null' &&
      mock.prototype &&
      typeof mock.prototype === 'object'
    ) {
      mock.prototype.constructor = mock;
    }

    return mock;
  }

  /**
   * @see README.md
   * @param metadata Metadata for the mock in the schema returned by the
   * getMetadata method of this module.
   */
  generateFromMetadata(_metadata: MockFunctionMetadata): Mock {
    const callbacks = [];
    const refs = {};
    const mock = this._generateMock(_metadata, callbacks, refs);
    callbacks.forEach(setter => setter());
    return mock;
  }

  /**
   * @see README.md
   * @param component The component for which to retrieve metadata.
   */
  getMetadata(component: any, _refs?: Map<any, any>): ?MockFunctionMetadata {
    const refs = _refs || new Map();
    const ref = refs.get(component);
    if (ref != null) {
      return {ref};
    }

    const type = getType(component);
    if (!type) {
      return null;
    }

    const metadata: MockFunctionMetadata = {type};
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
      if (component._isMockFunction === true) {
        metadata.mockImpl = component.getMockImplementation();
      }
    }

    metadata.refID = refs.size;
    refs.set(component, metadata.refID);

    let members = null;
    // Leave arrays alone
    if (type !== 'array') {
      if (type !== 'undefined') {
        this._getSlots(component).forEach(slot => {
          if (
            type === 'function' &&
            component._isMockFunction === true &&
            slot.match(/^mock/)
          ) {
            return;
          }

          const slotMetadata = this.getMetadata(component[slot], refs);
          if (slotMetadata) {
            if (!members) {
              members = {};
            }
            members[slot] = slotMetadata;
          }
        });
      }
    }

    if (members) {
      metadata.members = members;
    }

    return metadata;
  }

  isMockFunction(fn: any): boolean {
    return !!fn && fn._isMockFunction === true;
  }

  fn(implementation?: any): any {
    const length = implementation ? implementation.length : 0;
    const fn = this._makeComponent({length, type: 'function'});
    if (implementation) {
      fn.mockImplementation(implementation);
    }
    return fn;
  }

  spyOn(object: any, methodName: any, accessType?: string): any {
    if (accessType) {
      return this._spyOnProperty(object, methodName, accessType);
    }

    if (typeof object !== 'object' && typeof object !== 'function') {
      throw new Error(
        'Cannot spyOn on a primitive value; ' + this._typeOf(object) + ' given',
      );
    }

    const original = object[methodName];

    if (!this.isMockFunction(original)) {
      if (typeof original !== 'function') {
        throw new Error(
          'Cannot spy the ' +
            methodName +
            ' property because it is not a function; ' +
            this._typeOf(original) +
            ' given instead',
        );
      }

      object[methodName] = this._makeComponent({type: 'function'}, () => {
        object[methodName] = original;
      });

      object[methodName].mockImplementation(function() {
        return original.apply(this, arguments);
      });
    }

    return object[methodName];
  }

  _spyOnProperty(obj: any, propertyName: any, accessType: string = 'get'): any {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
      throw new Error(
        'Cannot spyOn on a primitive value; ' + this._typeOf(obj) + ' given',
      );
    }

    if (!obj) {
      throw new Error(
        'spyOn could not find an object to spy upon for ' + propertyName + '',
      );
    }

    if (!propertyName) {
      throw new Error('No property name supplied');
    }

    let descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
    let proto = Object.getPrototypeOf(obj);

    while (!descriptor && proto !== null) {
      descriptor = Object.getOwnPropertyDescriptor(proto, propertyName);
      proto = Object.getPrototypeOf(proto);
    }

    if (!descriptor) {
      throw new Error(propertyName + ' property does not exist');
    }

    if (!descriptor.configurable) {
      throw new Error(propertyName + ' is not declared configurable');
    }

    if (!descriptor[accessType]) {
      throw new Error(
        'Property ' + propertyName + ' does not have access type ' + accessType,
      );
    }

    const original = descriptor[accessType];

    if (!this.isMockFunction(original)) {
      if (typeof original !== 'function') {
        throw new Error(
          'Cannot spy the ' +
            propertyName +
            ' property because it is not a function; ' +
            this._typeOf(original) +
            ' given instead',
        );
      }

      descriptor[accessType] = this._makeComponent({type: 'function'}, () => {
        // $FlowFixMe
        descriptor[accessType] = original;
        // $FlowFixMe
        Object.defineProperty(obj, propertyName, descriptor);
      });

      descriptor[accessType].mockImplementation(function() {
        return original.apply(this, arguments);
      });
    }

    Object.defineProperty(obj, propertyName, descriptor);
    return descriptor[accessType];
  }

  clearAllMocks() {
    this._mockState = new WeakMap();
  }

  resetAllMocks() {
    this._mockConfigRegistry = new WeakMap();
    this._mockState = new WeakMap();
  }

  restoreAllMocks() {
    this._spyState.forEach(restore => restore());
    this._spyState = new Set();
  }

  _typeOf(value: any): string {
    return value == null ? '' + value : typeof value;
  }
}

export type ModuleMocker = ModuleMockerClass;
module.exports = new ModuleMockerClass(global);
