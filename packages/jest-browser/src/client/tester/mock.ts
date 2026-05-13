/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/unbound-method, sort-keys, unicorn/consistent-function-scoping */

type MockResult =
  | {type: 'return'; value: unknown}
  | {type: 'throw'; value: unknown};

type MockState = {
  calls: Array<Array<unknown>>;
  results: Array<MockResult>;
  instances: Array<unknown>;
};

type MockImplementation = (this: unknown, ...args: Array<unknown>) => unknown;

export type MockFunction = ((...args: Array<unknown>) => unknown) & {
  _isMock: true;
  mock: MockState;
  mockImplementation: (impl: MockImplementation) => MockFunction;
  mockImplementationOnce: (impl: MockImplementation) => MockFunction;
  mockReturnValue: (value: unknown) => MockFunction;
  mockReturnValueOnce: (value: unknown) => MockFunction;
  mockResolvedValue: (value: unknown) => MockFunction;
  mockResolvedValueOnce: (value: unknown) => MockFunction;
  mockRejectedValue: (value: unknown) => MockFunction;
  mockRejectedValueOnce: (value: unknown) => MockFunction;
  mockClear: () => MockFunction;
  mockReset: () => MockFunction;
  mockRestore: () => MockFunction;
};

function getPropertyDescriptor(
  target: object,
  property: string,
): PropertyDescriptor | undefined {
  let current: object | null = target;

  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, property);
    if (descriptor) {
      return descriptor;
    }
    current = Object.getPrototypeOf(current);
  }

  return undefined;
}

export function createMockSystem(): {
  fn: (impl?: MockImplementation) => MockFunction;
  spyOn: (obj: any, method: string, accessType?: 'get' | 'set') => MockFunction;
  mocked: <T>(item: T) => T;
  isMockFunction: (fn: any) => boolean;
  clearAllMocks: () => void;
  resetAllMocks: () => void;
  restoreAllMocks: () => void;
} {
  const trackedMocks = new Set<MockFunction>();
  const baseAccessorDescriptors = new WeakMap<
    object,
    Map<string, PropertyDescriptor>
  >();

  const getBaseAccessorDescriptor = (
    obj: object,
    method: string,
    current: PropertyDescriptor,
  ): PropertyDescriptor => {
    let objectDescriptors = baseAccessorDescriptors.get(obj);
    if (!objectDescriptors) {
      objectDescriptors = new Map<string, PropertyDescriptor>();
      baseAccessorDescriptors.set(obj, objectDescriptors);
    }

    const cached = objectDescriptors.get(method);
    if (cached) {
      return cached;
    }

    objectDescriptors.set(method, current);
    return current;
  };

  const fn = (impl?: MockImplementation): MockFunction => {
    let implementation = impl;
    let onceImpls: Array<MockImplementation> = [];

    const mockState: MockState = {
      calls: [],
      results: [],
      instances: [],
    };

    const mockFn = function (this: unknown, ...args: Array<unknown>): unknown {
      mockState.calls.push(args);
      mockState.instances.push(this);

      const selectedImpl =
        onceImpls.length > 0 ? onceImpls.shift() : implementation;

      try {
        const value = selectedImpl ? selectedImpl.apply(this, args) : undefined;
        mockState.results.push({type: 'return', value});
        return value;
      } catch (error) {
        mockState.results.push({type: 'throw', value: error});
        throw error;
      }
    } as MockFunction;

    mockFn._isMock = true;
    mockFn.mock = mockState;

    mockFn.mockImplementation = (
      nextImpl: MockImplementation,
    ): MockFunction => {
      implementation = nextImpl;
      return mockFn;
    };

    mockFn.mockImplementationOnce = (
      nextImpl: MockImplementation,
    ): MockFunction => {
      onceImpls.push(nextImpl);
      return mockFn;
    };

    mockFn.mockReturnValue = (value: unknown): MockFunction => {
      implementation = function () {
        return value;
      };
      return mockFn;
    };

    mockFn.mockReturnValueOnce = (value: unknown): MockFunction => {
      onceImpls.push(() => {
        return value;
      });
      return mockFn;
    };

    mockFn.mockResolvedValue = (value: unknown): MockFunction => {
      implementation = function () {
        return Promise.resolve(value);
      };
      return mockFn;
    };

    mockFn.mockResolvedValueOnce = (value: unknown): MockFunction => {
      onceImpls.push(() => {
        return Promise.resolve(value);
      });
      return mockFn;
    };

    mockFn.mockRejectedValue = (value: unknown): MockFunction => {
      implementation = function () {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(value);
      };
      return mockFn;
    };

    mockFn.mockRejectedValueOnce = (value: unknown): MockFunction => {
      onceImpls.push(() => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(value);
      });
      return mockFn;
    };

    mockFn.mockClear = (): MockFunction => {
      mockState.calls.length = 0;
      mockState.results.length = 0;
      mockState.instances.length = 0;
      return mockFn;
    };

    mockFn.mockReset = (): MockFunction => {
      mockFn.mockClear();
      implementation = undefined;
      onceImpls = [];
      return mockFn;
    };

    mockFn.mockRestore = (): MockFunction => mockFn.mockReset();

    trackedMocks.add(mockFn);
    return mockFn;
  };

  const spyOn = (
    obj: any,
    method: string,
    accessType?: 'get' | 'set',
  ): MockFunction => {
    if (obj == null) {
      throw new Error('Cannot spyOn on null or undefined');
    }

    const hadOwn = Object.prototype.hasOwnProperty.call(obj, method);
    const originalDescriptor = getPropertyDescriptor(obj, method);

    if (accessType) {
      if (!originalDescriptor) {
        throw new Error(`Property ${method} does not exist`);
      }

      const baseDescriptor = getBaseAccessorDescriptor(
        obj as object,
        method,
        originalDescriptor,
      );

      const originalGetter = originalDescriptor.get;
      const originalSetter = originalDescriptor.set;

      const accessorMock =
        accessType === 'get'
          ? fn(function (this: unknown) {
              return originalGetter ? originalGetter.call(this) : undefined;
            })
          : fn(function (this: unknown, value: unknown) {
              if (originalSetter) {
                return originalSetter.call(this, value);
              }
              return undefined;
            });

      Object.defineProperty(obj, method, {
        configurable: true,
        enumerable: originalDescriptor.enumerable ?? false,
        get:
          accessType === 'get'
            ? (accessorMock as unknown as () => unknown)
            : originalGetter,
        set:
          accessType === 'set'
            ? (accessorMock as unknown as (value: unknown) => void)
            : originalSetter,
      });

      accessorMock.mockRestore = (): MockFunction => {
        accessorMock.mockReset();

        const currentDescriptor = getPropertyDescriptor(obj, method);
        const restoredDescriptor: PropertyDescriptor = {
          configurable: baseDescriptor.configurable ?? true,
          enumerable: baseDescriptor.enumerable ?? false,
          get:
            accessType === 'get'
              ? baseDescriptor.get
              : (currentDescriptor?.get ?? baseDescriptor.get),
          set:
            accessType === 'set'
              ? baseDescriptor.set
              : (currentDescriptor?.set ?? baseDescriptor.set),
        };

        if (hadOwn || currentDescriptor) {
          Object.defineProperty(obj, method, restoredDescriptor);
        } else {
          delete obj[method];
        }

        return accessorMock;
      };

      return accessorMock;
    }

    const originalValue = obj[method];
    const methodMock = fn(function (this: unknown, ...args: Array<unknown>) {
      if (typeof originalValue === 'function') {
        return originalValue.apply(this, args);
      }

      return undefined;
    });

    obj[method] = methodMock;

    methodMock.mockRestore = (): MockFunction => {
      methodMock.mockReset();

      if (hadOwn) {
        obj[method] = originalValue;
      } else {
        delete obj[method];
      }

      return methodMock;
    };

    return methodMock;
  };

  const mocked = <T>(item: T): T => item;

  const isMockFunction = (value: any): boolean => Boolean(value?._isMock);

  const clearAllMocks = (): void => {
    for (const mock of trackedMocks) {
      mock.mockClear();
    }
  };

  const resetAllMocks = (): void => {
    for (const mock of trackedMocks) {
      mock.mockReset();
    }
  };

  const restoreAllMocks = (): void => {
    for (const mock of trackedMocks) {
      mock.mockRestore();
    }
  };

  return {
    clearAllMocks,
    fn,
    isMockFunction,
    mocked,
    resetAllMocks,
    restoreAllMocks,
    spyOn,
  };
}
