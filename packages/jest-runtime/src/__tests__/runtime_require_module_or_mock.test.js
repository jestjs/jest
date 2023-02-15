/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const moduleNameMapper = {
  '\\.css$': '<rootDir>/__mocks__/ManuallyMocked',
  '^[./a-zA-Z0-9$_-]+.png$': 'RelativeImageStub',
  '^image![a-zA-Z0-9$_-]+$': 'global_image_stub',
  mappedToDirectory: '<rootDir>/MyDirectoryModule',
  mappedToModule: '<rootDir>/TestModuleNameMapperResolution',
  mappedToPath: '<rootDir>/global_image_stub.js',
  'module/name/(.*)': '<rootDir>/mapped_module_$1.js',
};

let createRuntime;

beforeEach(() => {
  createRuntime = require('createRuntime');
});

it('mocks modules by default when using automocking', async () => {
  const runtime = await createRuntime(__filename, {
    automock: true,
    moduleNameMapper,
  });
  const exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'RegularModule',
  );
  expect(exports.setModuleStateValue._isMockFunction).toBe(true);
});

it("doesn't mock modules when explicitly unmocked when using automocking", async () => {
  const runtime = await createRuntime(__filename, {
    automock: true,
    moduleNameMapper,
  });
  const root = runtime.requireModule(runtime.__mockRootPath);
  root.jest.unmock('RegularModule');
  const exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'RegularModule',
  );
  expect(exports.isRealModule).toBe(true);
});

it("doesn't mock modules when explicitly unmocked via a different name", async () => {
  const runtime = await createRuntime(__filename, {
    automock: true,
    moduleNameMapper,
  });
  const root = runtime.requireModule(runtime.__mockRootPath);
  root.jest.unmock('./RegularModule');
  const exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'RegularModule',
  );
  expect(exports.isRealModule).toBe(true);
});

it("doesn't mock modules when disableAutomock() has been called", async () => {
  const runtime = await createRuntime(__filename, {moduleNameMapper});
  const root = runtime.requireModule(runtime.__mockRootPath);
  root.jest.disableAutomock();
  const exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'RegularModule',
  );
  expect(exports.isRealModule).toBe(true);
});

it('uses manual mock when automocking on and mock is available', async () => {
  const runtime = await createRuntime(__filename, {
    automock: true,
    moduleNameMapper,
  });
  const exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'ManuallyMocked',
  );
  expect(exports.isManualMockModule).toBe(true);
});

it('does not use manual mock when automocking is off and a real module is available', async () => {
  const runtime = await createRuntime(__filename, {moduleNameMapper});
  const root = runtime.requireModule(runtime.__mockRootPath);
  root.jest.disableAutomock();
  const exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'ManuallyMocked',
  );
  expect(exports.isManualMockModule).toBe(false);
});

it('resolves mapped module names and unmocks them by default', async () => {
  const runtime = await createRuntime(__filename, {
    moduleFileExtensions: ['js', 'jsx'],
    moduleNameMapper,
  });
  let exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'image!not_really_a_module',
  );
  expect(exports.isGlobalImageStub).toBe(true);
  exports = runtime.requireModuleOrMock(runtime.__mockRootPath, 'mappedToPath');
  expect(exports.isGlobalImageStub).toBe(true);

  exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'mappedToModule',
  );
  expect(exports.moduleNameMapperResolutionWorks).toBe(true);

  exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'mappedToDirectory',
  );
  expect(exports.isIndex).toBe(true);

  exports = runtime.requireModuleOrMock(runtime.__mockRootPath, 'cat.png');
  expect(exports.isRelativeImageStub).toBe(true);

  exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    '../photos/dog.png',
  );
  expect(exports.isRelativeImageStub).toBe(true);

  exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'module/name/test',
  );
  expect(exports).toBe('mapped_module');

  exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'subdir1/style.css',
  );
  expect(exports.isManualMockModule).toBe(true);
});

it('automocking is disabled by default', async () => {
  const runtime = await createRuntime(__filename, {
    moduleNameMapper,
  });
  const exports = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'RegularModule',
  );
  expect(exports.setModuleStateValue._isMockFunction).toBeUndefined();
});

it('unmocks modules in config.unmockedModulePathPatterns for tests with automock enabled when automock is false', async () => {
  const runtime = await createRuntime(__filename, {
    automock: false,
    moduleNameMapper,
    unmockedModulePathPatterns: ['npm3-main-dep'],
  });
  const root = runtime.requireModule(runtime.__mockRootPath);
  root.jest.enableAutomock();
  const nodeModule = runtime.requireModuleOrMock(
    runtime.__mockRootPath,
    'npm3-main-dep',
  );
  const moduleData = nodeModule();
  expect(moduleData.isUnmocked()).toBe(true);
});

it('unmocks virtual mocks after they have been mocked previously', async () => {
  const runtime = await createRuntime(__filename);
  const root = runtime.requireModule(runtime.__mockRootPath);

  const mockImpl = {foo: 'bar'};
  root.jest.mock('my-virtual-module', () => mockImpl, {virtual: true});

  expect(
    runtime.requireModuleOrMock(runtime.__mockRootPath, 'my-virtual-module'),
  ).toEqual(mockImpl);

  root.jest.unmock('my-virtual-module');

  expect(() => {
    runtime.requireModuleOrMock(runtime.__mockRootPath, 'my-virtual-module');
  }).toThrow(
    new Error("Cannot find module 'my-virtual-module' from 'root.js'"),
  );
});

describe('resetModules', () => {
  it('resets all the modules', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    let exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    expect(exports.getState()).toBe(1);
    exports.increment();
    expect(exports.getState()).toBe(2);
    runtime.resetModules();
    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    expect(exports.getState()).toBe(1);
  });
});

describe('isolateModules', () => {
  it('keeps its registry isolated from global one', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    let exports;
    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    exports.increment();
    expect(exports.getState()).toBe(2);

    runtime.isolateModules(() => {
      exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'ModuleWithState',
      );
      expect(exports.getState()).toBe(1);
    });

    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    expect(exports.getState()).toBe(2);
  });

  it('resets all modules after the block', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    let exports;
    runtime.isolateModules(() => {
      exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'ModuleWithState',
      );
      expect(exports.getState()).toBe(1);
      exports.increment();
      expect(exports.getState()).toBe(2);
    });

    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    expect(exports.getState()).toBe(1);
  });

  it('resets module after failing', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    expect(() =>
      runtime.isolateModules(() => {
        throw new Error('Error from isolated module');
      }),
    ).toThrow('Error from isolated module');

    runtime.isolateModules(() => {
      expect(true).toBe(true);
    });
  });

  it('cannot nest isolateModules blocks', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    expect(() => {
      runtime.isolateModules(() => {
        runtime.isolateModules(() => {});
      });
    }).toThrow(
      'isolateModules cannot be nested inside another isolateModules or isolateModulesAsync.',
    );
  });

  it('can call resetModules within a isolateModules block', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    let exports;
    runtime.isolateModules(() => {
      exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'ModuleWithState',
      );
      expect(exports.getState()).toBe(1);

      exports.increment();
      runtime.resetModules();

      exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'ModuleWithState',
      );
      expect(exports.getState()).toBe(1);
    });

    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    expect(exports.getState()).toBe(1);
  });

  describe('can use isolateModules from a beforeEach block', () => {
    let exports;
    beforeEach(() => {
      jest.isolateModules(() => {
        exports = require('./test_root/ModuleWithState');
        exports.set(1); // Ensure idempotency with the isolateModulesAsync test
      });
    });

    it('can use the required module from beforeEach and re-require it', () => {
      expect(exports.getState()).toBe(1);
      exports.increment();
      expect(exports.getState()).toBe(2);

      exports = require('./test_root/ModuleWithState');
      expect(exports.getState()).toBe(1);
      exports.increment();
      expect(exports.getState()).toBe(2);
    });
  });
});

describe('isolateModulesAsync', () => {
  it('keeps its registry isolated from global one', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    let exports;
    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    exports.increment();
    expect(exports.getState()).toBe(2);

    await runtime.isolateModulesAsync(async () => {
      exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'ModuleWithState',
      );
      expect(exports.getState()).toBe(1);
    });

    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    expect(exports.getState()).toBe(2);
  });

  it('resets all modules after the block', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    let exports;
    await runtime.isolateModulesAsync(async () => {
      exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'ModuleWithState',
      );
      expect(exports.getState()).toBe(1);
      exports.increment();
      expect(exports.getState()).toBe(2);
    });

    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    expect(exports.getState()).toBe(1);
  });

  it('resets module after failing', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    await expect(
      runtime.isolateModulesAsync(async () => {
        throw new Error('Error from isolated module');
      }),
    ).rejects.toThrow('Error from isolated module');

    await runtime.isolateModulesAsync(async () => {
      expect(true).toBe(true);
    });
  });

  it('cannot nest isolateModulesAsync blocks', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    await expect(async () => {
      await runtime.isolateModulesAsync(async () => {
        await runtime.isolateModulesAsync(() => Promise.resolve());
      });
    }).rejects.toThrow(
      'isolateModulesAsync cannot be nested inside another isolateModulesAsync or isolateModules.',
    );
  });

  it('can call resetModules within a isolateModules block', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper,
    });
    let exports;
    await runtime.isolateModulesAsync(async () => {
      exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'ModuleWithState',
      );
      expect(exports.getState()).toBe(1);

      exports.increment();
      runtime.resetModules();

      exports = runtime.requireModuleOrMock(
        runtime.__mockRootPath,
        'ModuleWithState',
      );
      expect(exports.getState()).toBe(1);
    });

    exports = runtime.requireModuleOrMock(
      runtime.__mockRootPath,
      'ModuleWithState',
    );
    expect(exports.getState()).toBe(1);
  });

  describe('can use isolateModulesAsync from a beforeEach block', () => {
    let exports;
    beforeEach(async () => {
      await jest.isolateModulesAsync(async () => {
        exports = require('./test_root/ModuleWithState');
        exports.set(1); // Ensure idempotency with the isolateModules test
      });
    });

    it('can use the required module from beforeEach and re-require it', () => {
      expect(exports.getState()).toBe(1);
      exports.increment();
      expect(exports.getState()).toBe(2);

      exports = require('./test_root/ModuleWithState');
      expect(exports.getState()).toBe(2);
      exports.increment();
      expect(exports.getState()).toBe(3);
    });
  });
});
