/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {sync as resolveSync} from 'resolve';
import {type IModuleMap, ModuleMap} from 'jest-haste-map';
import userResolver from '../__mocks__/userResolver';
import userResolverAsync from '../__mocks__/userResolverAsync';
import defaultResolver, {type PackageFilter} from '../defaultResolver';
import nodeModulesPaths from '../nodeModulesPaths';
import Resolver from '../resolver';
import type {ResolverConfig} from '../types';

jest.mock('../__mocks__/userResolver').mock('../__mocks__/userResolverAsync');

// Do not fully mock `resolve` because it is used by Jest. Doing it will crash
// in very strange ways. Instead, just spy on it and its `sync` method.
jest.mock('resolve', () => {
  const originalModule =
    jest.requireActual<typeof import('resolve')>('resolve');

  const m = jest.fn<typeof import('resolve')>((...args) =>
    originalModule(...args),
  );
  Object.assign(m, originalModule);
  m.sync = jest.spyOn(originalModule, 'sync');

  return m;
});

const mockUserResolver = jest.mocked(userResolver);
const mockUserResolverAsync = jest.mocked(userResolverAsync);
const mockResolveSync = jest.mocked(resolveSync);

beforeEach(() => {
  mockUserResolver.mockClear();
  mockUserResolverAsync.async.mockClear();
  mockResolveSync.mockClear();

  Resolver.clearDefaultResolverCache();
});

describe('isCoreModule', () => {
  it('returns false if `hasCoreModules` is false.', () => {
    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {
      hasCoreModules: false,
    } as ResolverConfig);
    const isCore = resolver.isCoreModule('assert');
    expect(isCore).toBe(false);
  });

  it('returns true if `hasCoreModules` is true and `moduleName` is a core module.', () => {
    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const isCore = resolver.isCoreModule('assert');
    expect(isCore).toBe(true);
  });

  it('returns false if `hasCoreModules` is true and `moduleName` is not a core module.', () => {
    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const isCore = resolver.isCoreModule('not-a-core-module');
    expect(isCore).toBe(false);
  });

  it('returns false if `hasCoreModules` is true and `moduleNameMapper` alias a module same name with core module', () => {
    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {
      moduleNameMapper: [
        {
          moduleName: '$1',
          regex: /^constants$/,
        },
      ],
    } as ResolverConfig);
    const isCore = resolver.isCoreModule('constants');
    expect(isCore).toBe(false);
  });

  it('returns true if using `node:` URLs and `moduleName` is a core module.', () => {
    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const isCore = resolver.isCoreModule('node:assert');
    expect(isCore).toBe(true);
  });

  it('returns true if using `node:` URLs and `moduleName` is not a core module.', () => {
    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const isCore = resolver.isCoreModule('node:not-a-core-module');
    expect(isCore).toBe(true);
  });
});

describe('findNodeModule', () => {
  it('is possible to override the default resolver', () => {
    const cwd = process.cwd();
    const resolvedCwd = fs.realpathSync(cwd) || cwd;
    const nodePaths = process.env.NODE_PATH
      ? process.env.NODE_PATH.split(path.delimiter)
          .filter(Boolean)
          .map(p => path.resolve(resolvedCwd, p))
      : null;

    mockUserResolver.mockImplementation(() => 'module');

    const newPath = Resolver.findNodeModule('test', {
      basedir: '/',
      conditions: ['conditions, woooo'],
      extensions: ['js'],
      moduleDirectory: ['node_modules'],
      paths: ['/something'],
      resolver: require.resolve('../__mocks__/userResolver'),
    });

    expect(newPath).toBe('module');
    expect(mockUserResolver.mock.calls[0][0]).toBe('test');
    expect(mockUserResolver.mock.calls[0][1]).toStrictEqual({
      basedir: '/',
      conditions: ['conditions, woooo'],
      defaultResolver,
      extensions: ['js'],
      moduleDirectory: ['node_modules'],
      paths: [...(nodePaths || []), '/something'],
      rootDir: undefined,
    });
  });

  it('wraps passed packageFilter to the resolve module when using the default resolver', () => {
    const packageFilter = jest.fn<PackageFilter>();

    // A resolver that delegates to defaultResolver with a packageFilter implementation
    mockUserResolver.mockImplementation((request, opts) =>
      opts.defaultResolver(request, {...opts, packageFilter}),
    );

    Resolver.findNodeModule('./test', {
      basedir: path.resolve(__dirname, '../__mocks__/'),
      resolver: require.resolve('../__mocks__/userResolver'),
    });

    expect(packageFilter).toHaveBeenCalledWith(
      expect.objectContaining({name: '__mocks__'}),
      expect.any(String),
    );
  });

  describe('conditions', () => {
    const conditionsRoot = path.resolve(__dirname, '../__mocks__/conditions');

    test('resolves without exports, just main', () => {
      const result = Resolver.findNodeModule('main', {
        basedir: conditionsRoot,
        conditions: ['require'],
      });

      expect(result).toEqual(
        path.resolve(conditionsRoot, './node_modules/main/file.js'),
      );
    });

    test('resolves with import', () => {
      const result = Resolver.findNodeModule('exports', {
        basedir: conditionsRoot,
        conditions: ['import'],
      });

      expect(result).toEqual(
        path.resolve(conditionsRoot, './node_modules/exports/import.js'),
      );
    });

    test('resolves with require', () => {
      const result = Resolver.findNodeModule('exports', {
        basedir: conditionsRoot,
        conditions: ['require'],
      });

      expect(result).toEqual(
        path.resolve(conditionsRoot, './node_modules/exports/require.js'),
      );
    });

    test('gets default when nothing is passed', () => {
      const result = Resolver.findNodeModule('exports', {
        basedir: conditionsRoot,
        conditions: [],
      });

      expect(result).toEqual(
        path.resolve(conditionsRoot, './node_modules/exports/default.js'),
      );
    });

    test('respects order in package.json, not conditions', () => {
      const resultImport = Resolver.findNodeModule('exports', {
        basedir: conditionsRoot,
        conditions: ['import', 'require'],
      });
      const resultRequire = Resolver.findNodeModule('exports', {
        basedir: conditionsRoot,
        conditions: ['require', 'import'],
      });

      expect(resultImport).toEqual(resultRequire);
    });

    test('supports nested paths', () => {
      const result = Resolver.findNodeModule('exports/nested', {
        basedir: conditionsRoot,
        conditions: [],
      });

      expect(result).toEqual(
        path.resolve(conditionsRoot, './node_modules/exports/nestedDefault.js'),
      );
    });

    test('supports nested paths with wildcard and no extension', () => {
      const result = Resolver.findNodeModule('exports/directory/file', {
        basedir: conditionsRoot,
        conditions: [],
      });

      expect(result).toEqual(
        path.resolve(
          conditionsRoot,
          './node_modules/exports/some-other-directory/file.js',
        ),
      );
    });

    test('supports nested conditions', () => {
      const resultRequire = Resolver.findNodeModule('exports/deeplyNested', {
        basedir: conditionsRoot,
        conditions: ['require'],
      });
      const resultDefault = Resolver.findNodeModule('exports/deeplyNested', {
        basedir: conditionsRoot,
        conditions: [],
      });

      expect(resultRequire).toEqual(
        path.resolve(conditionsRoot, './node_modules/exports/nestedRequire.js'),
      );

      expect(resultDefault).toEqual(
        path.resolve(conditionsRoot, './node_modules/exports/nestedDefault.js'),
      );
    });

    test('supports separate directory path', () => {
      const result = Resolver.findNodeModule('exports/directory/file.js', {
        basedir: conditionsRoot,
        conditions: [],
      });

      expect(result).toEqual(
        path.resolve(
          conditionsRoot,
          './node_modules/exports/some-other-directory/file.js',
        ),
      );
    });
  });

  describe('self-reference', () => {
    const selfRefRoot = path.resolve(__dirname, '../__mocks__/self-ref');

    test('supports self-reference', () => {
      const result = Resolver.findNodeModule('foo', {
        basedir: path.resolve(selfRefRoot, './foo/index.js'),
        conditions: [],
      });

      expect(result).toEqual(path.resolve(selfRefRoot, './foo/file.js'));
    });

    test('supports nested self-reference', () => {
      const result = Resolver.findNodeModule('foo', {
        basedir: path.resolve(selfRefRoot, './foo/nested/index.js'),
        conditions: [],
      });

      expect(result).toEqual(path.resolve(selfRefRoot, './foo/file.js'));
    });

    test('fails if own pkg.json with different name', () => {
      const result = Resolver.findNodeModule('foo', {
        basedir: path.resolve(
          selfRefRoot,
          './foo/nested-with-own-pkg/index.js',
        ),
        conditions: [],
      });

      expect(result).toBeNull();
    });

    test('fails if own pkg.json with no exports', () => {
      const result = Resolver.findNodeModule('foo-no-exports', {
        basedir: path.resolve(
          selfRefRoot,
          './foo/nested-with-no-exports/index.js',
        ),
        conditions: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('imports', () => {
    const importsRoot = path.resolve(__dirname, '../__mocks__/imports');

    test('supports internal reference', () => {
      const result = Resolver.findNodeModule('#nested', {
        basedir: path.resolve(importsRoot, './foo-import/index.cjs'),
        conditions: ['require'],
      });

      expect(result).toEqual(
        path.resolve(importsRoot, './foo-import/internal.cjs'),
      );
    });

    test('supports external reference', () => {
      const result = Resolver.findNodeModule('#nested', {
        basedir: path.resolve(importsRoot, './foo-import/index.js'),
        conditions: [],
      });

      expect(result).toEqual(
        path.resolve(
          importsRoot,
          './foo-import/node_modules/external-foo/main.js',
        ),
      );
    });

    test('supports nested pattern', () => {
      const result = Resolver.findNodeModule('#nested', {
        basedir: path.resolve(importsRoot, './nested-import/index.cjs'),
        conditions: ['node', 'require'],
      });

      expect(result).toEqual(
        path.resolve(importsRoot, './nested-import/node.cjs'),
      );
    });

    describe('supports array pattern', () => {
      test('resolve to first found', () => {
        const result = Resolver.findNodeModule('#array-import', {
          basedir: path.resolve(importsRoot, './array-import/index.cjs'),
          conditions: ['import'],
        });

        expect(result).toEqual(
          path.resolve(importsRoot, './array-import/node.mjs'),
        );
      });

      test('skip over not met nested condition', () => {
        const result = Resolver.findNodeModule('#array-import', {
          basedir: path.resolve(importsRoot, './array-import/index.cjs'),
          conditions: ['browser'],
        });

        expect(result).toEqual(
          path.resolve(importsRoot, './array-import/browser.cjs'),
        );
      });

      test('match nested condition', () => {
        const result = Resolver.findNodeModule('#array-import', {
          basedir: path.resolve(importsRoot, './array-import/index.cjs'),
          conditions: ['chrome', 'browser'],
        });

        expect(result).toEqual(
          path.resolve(importsRoot, './array-import/chrome.cjs'),
        );
      });
    });

    test('fails for non-existent mapping', () => {
      expect(() => {
        Resolver.findNodeModule('#something-else', {
          basedir: path.resolve(importsRoot, './foo-import/index.js'),
          conditions: [],
        });
      }).toThrow('Missing "#something-else" specifier in "foo-import" package');
    });
  });
});

describe('findNodeModuleAsync', () => {
  it('is possible to override the default resolver', async () => {
    const cwd = process.cwd();
    const resolvedCwd = fs.realpathSync(cwd) || cwd;
    const nodePaths = process.env.NODE_PATH
      ? process.env.NODE_PATH.split(path.delimiter)
          .filter(Boolean)
          .map(p => path.resolve(resolvedCwd, p))
      : null;

    mockUserResolverAsync.async.mockResolvedValue('module');

    const newPath = await Resolver.findNodeModuleAsync('test', {
      basedir: '/',
      conditions: ['conditions, woooo'],
      extensions: ['js'],
      moduleDirectory: ['node_modules'],
      paths: ['/something'],
      resolver: require.resolve('../__mocks__/userResolverAsync'),
    });

    expect(newPath).toBe('module');
    expect(mockUserResolverAsync.async.mock.calls[0][0]).toBe('test');
    expect(mockUserResolverAsync.async.mock.calls[0][1]).toStrictEqual({
      basedir: '/',
      conditions: ['conditions, woooo'],
      defaultResolver,
      extensions: ['js'],
      moduleDirectory: ['node_modules'],
      paths: [...(nodePaths || []), '/something'],
      rootDir: undefined,
    });
  });

  it('passes packageFilter to the resolve module when using the default resolver', async () => {
    const packageFilter = jest.fn<PackageFilter>();

    // A resolver that delegates to defaultResolver with a packageFilter implementation
    mockUserResolverAsync.async.mockImplementation((request, opts) =>
      Promise.resolve(opts.defaultResolver(request, {...opts, packageFilter})),
    );

    await Resolver.findNodeModuleAsync('test', {
      basedir: '/',
      resolver: require.resolve('../__mocks__/userResolverAsync'),
    });

    expect(mockResolveSync).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({
        packageFilter,
      }),
    );
  });
});

describe('resolveModule', () => {
  let moduleMap: IModuleMap;
  beforeEach(() => {
    moduleMap = ModuleMap.create('/');
  });

  it('is possible to resolve node modules', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    } as ResolverConfig);
    const src = require.resolve('../');
    const resolved = resolver.resolveModule(
      src,
      './__mocks__/mockJsDependency',
    );
    expect(resolved).toBe(require.resolve('../__mocks__/mockJsDependency.js'));
  });

  it('is possible to resolve node modules with custom extensions', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js', '.jsx'],
    } as ResolverConfig);
    const src = require.resolve('../');
    const resolvedJsx = resolver.resolveModule(
      src,
      './__mocks__/mockJsxDependency',
    );
    expect(resolvedJsx).toBe(
      require.resolve('../__mocks__/mockJsxDependency.jsx'),
    );
  });

  it('is possible to resolve node modules with custom extensions and platforms', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js', '.jsx'],
      platforms: ['native'],
    } as ResolverConfig);
    const src = require.resolve('../');
    const resolvedJsx = resolver.resolveModule(
      src,
      './__mocks__/mockJsxDependency',
    );
    expect(resolvedJsx).toBe(
      require.resolve('../__mocks__/mockJsxDependency.native.jsx'),
    );
  });

  it('is possible to resolve node modules by resolving their realpath', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    } as ResolverConfig);
    const src = path.join(
      path.resolve(__dirname, '../../src/__mocks__/bar/node_modules/'),
      'foo/index.js',
    );
    const resolved = resolver.resolveModule(src, 'dep');
    expect(resolved).toBe(
      require.resolve('../../src/__mocks__/foo/node_modules/dep/index.js'),
    );
  });

  it('is possible to specify custom resolve paths', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    } as ResolverConfig);
    const src = require.resolve('../');
    const resolved = resolver.resolveModule(src, 'mockJsDependency', {
      paths: [
        path.resolve(__dirname, '../../src/__mocks__'),
        path.resolve(__dirname, '../../src/__tests__'),
      ],
    });
    expect(resolved).toBe(require.resolve('../__mocks__/mockJsDependency.js'));
  });

  it('does not confuse directories with files', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    } as ResolverConfig);
    const mocksDirectory = path.resolve(__dirname, '../__mocks__');
    const fooSlashFoo = path.join(mocksDirectory, 'foo/foo.js');
    const fooSlashIndex = path.join(mocksDirectory, 'foo/index.js');

    const resolvedWithSlash = resolver.resolveModule(fooSlashFoo, './');
    const resolvedWithDot = resolver.resolveModule(fooSlashFoo, '.');
    expect(resolvedWithSlash).toBe(fooSlashIndex);
    expect(resolvedWithSlash).toBe(resolvedWithDot);
  });

  it('custom resolver can resolve node modules', () => {
    mockUserResolver.mockImplementation(() => 'module');

    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
      resolver: require.resolve('../__mocks__/userResolver'),
    } as ResolverConfig);
    const src = require.resolve('../');
    resolver.resolveModule(src, 'fs');

    expect(mockUserResolver).toHaveBeenCalled();
    expect(mockUserResolver.mock.calls[0][0]).toBe('fs');
  });

  it('handles unmatched capture groups correctly', () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
      moduleNameMapper: [
        {
          moduleName: './__mocks__/foo$1',
          regex: /^@Foo(\/.*)?$/,
        },
      ],
    } as ResolverConfig);
    const src = require.resolve('../');
    expect(resolver.resolveModule(src, '@Foo')).toBe(
      require.resolve('../__mocks__/foo.js'),
    );
    expect(resolver.resolveModule(src, '@Foo/bar')).toBe(
      require.resolve('../__mocks__/foo/bar/index.js'),
    );
  });
});

describe('resolveModuleAsync', () => {
  let moduleMap: IModuleMap;
  beforeEach(() => {
    moduleMap = ModuleMap.create('/');
  });

  it('is possible to resolve node modules', async () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    } as ResolverConfig);
    const src = require.resolve('../');
    const resolved = await resolver.resolveModuleAsync(
      src,
      './__mocks__/mockJsDependency',
    );
    expect(resolved).toBe(require.resolve('../__mocks__/mockJsDependency.js'));
  });

  it('is possible to resolve node modules with custom extensions', async () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js', '.jsx'],
    } as ResolverConfig);
    const src = require.resolve('../');
    const resolvedJsx = await resolver.resolveModuleAsync(
      src,
      './__mocks__/mockJsxDependency',
    );
    expect(resolvedJsx).toBe(
      require.resolve('../__mocks__/mockJsxDependency.jsx'),
    );
  });

  it('is possible to resolve node modules with custom extensions and platforms', async () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js', '.jsx'],
      platforms: ['native'],
    } as ResolverConfig);
    const src = require.resolve('../');
    const resolvedJsx = await resolver.resolveModuleAsync(
      src,
      './__mocks__/mockJsxDependency',
    );
    expect(resolvedJsx).toBe(
      require.resolve('../__mocks__/mockJsxDependency.native.jsx'),
    );
  });

  it('is possible to resolve node modules by resolving their realpath', async () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    } as ResolverConfig);
    const src = path.join(
      path.resolve(__dirname, '../../src/__mocks__/bar/node_modules/'),
      'foo/index.js',
    );
    const resolved = await resolver.resolveModuleAsync(src, 'dep');
    expect(resolved).toBe(
      require.resolve('../../src/__mocks__/foo/node_modules/dep/index.js'),
    );
  });

  it('is possible to specify custom resolve paths', async () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    } as ResolverConfig);
    const src = require.resolve('../');
    const resolved = await resolver.resolveModuleAsync(
      src,
      'mockJsDependency',
      {
        paths: [
          path.resolve(__dirname, '../../src/__tests__'),
          path.resolve(__dirname, '../../src/__mocks__'),
        ],
      },
    );
    expect(resolved).toBe(require.resolve('../__mocks__/mockJsDependency.js'));
  });

  it('does not confuse directories with files', async () => {
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
    } as ResolverConfig);
    const mocksDirectory = path.resolve(__dirname, '../__mocks__');
    const fooSlashFoo = path.join(mocksDirectory, 'foo/foo.js');
    const fooSlashIndex = path.join(mocksDirectory, 'foo/index.js');

    const resolvedWithSlash = await resolver.resolveModuleAsync(
      fooSlashFoo,
      './',
    );
    const resolvedWithDot = await resolver.resolveModuleAsync(fooSlashFoo, '.');
    expect(resolvedWithSlash).toBe(fooSlashIndex);
    expect(resolvedWithSlash).toBe(resolvedWithDot);
  });
});

describe('getMockModule', () => {
  it('is possible to use custom resolver to resolve deps inside mock modules with moduleNameMapper', () => {
    mockUserResolver.mockImplementation(() => 'module');

    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
      moduleNameMapper: [
        {
          moduleName: '$1',
          regex: /(.*)/,
        },
      ],
      resolver: require.resolve('../__mocks__/userResolver'),
    } as ResolverConfig);
    const src = require.resolve('../');
    resolver.getMockModule(src, 'dependentModule');

    expect(mockUserResolver).toHaveBeenCalled();
    expect(mockUserResolver.mock.calls[0][0]).toBe('dependentModule');
    expect(mockUserResolver.mock.calls[0][1]).toHaveProperty(
      'basedir',
      path.dirname(src),
    );
  });
});

describe('getMockModuleAsync', () => {
  it('is possible to use custom resolver to resolve deps inside mock modules with moduleNameMapper', async () => {
    mockUserResolverAsync.async.mockResolvedValue('module');

    const moduleMap = ModuleMap.create('/');
    const resolver = new Resolver(moduleMap, {
      extensions: ['.js'],
      moduleNameMapper: [
        {
          moduleName: '$1',
          regex: /(.*)/,
        },
      ],
      resolver: require.resolve('../__mocks__/userResolverAsync'),
    } as ResolverConfig);
    const src = require.resolve('../');

    await resolver.resolveModuleAsync(src, 'dependentModule');

    expect(mockUserResolverAsync.async).toHaveBeenCalled();
    expect(mockUserResolverAsync.async.mock.calls[0][0]).toBe(
      'dependentModule',
    );
    expect(mockUserResolverAsync.async.mock.calls[0][1]).toHaveProperty(
      'basedir',
      path.dirname(src),
    );
  });
});

describe('nodeModulesPaths', () => {
  it('provides custom module paths after node_modules', () => {
    const src = require.resolve('../');
    const result = nodeModulesPaths(src, {paths: ['./customFolder']});
    expect(result.at(-1)).toBe('./customFolder');
  });

  it('provides custom module multy paths after node_modules', () => {
    const src = require.resolve('../');
    const result = nodeModulesPaths(src, {
      paths: ['./customFolder', './customFolder2', './customFolder3'],
    });
    expect(result.slice(-3)).toStrictEqual([
      './customFolder',
      './customFolder2',
      './customFolder3',
    ]);
  });
});

describe('Resolver.getModulePaths() -> nodeModulesPaths()', () => {
  const _path = path;
  let moduleMap: IModuleMap;

  beforeEach(() => {
    jest.resetModules();

    moduleMap = ModuleMap.create('/');

    // Mocking realpath to function the old way, where it just looks at
    // pathstrings instead of actually trying to access the physical directory.
    // This test suite won't work otherwise, since we cannot make assumptions
    // about the test environment when it comes to absolute paths.
    jest.doMock('graceful-fs', () => ({
      ...jest.requireActual<typeof import('graceful-fs')>('graceful-fs'),
      realPathSync: {
        native: (dirInput: string) => dirInput,
      },
    }));
  });

  afterAll(() => {
    jest.resetModules();
    jest.dontMock('path');
  });

  it('can resolve node modules relative to absolute paths in "moduleDirectories" on Windows platforms', () => {
    jest.doMock('path', () => _path.win32);
    const path = require('path');
    const Resolver = require('../').default;

    const cwd = 'D:\\temp\\project';
    const src = 'C:\\path\\to\\node_modules';
    const resolver = new Resolver(moduleMap, {
      moduleDirectories: [src, 'node_modules'],
    });
    const dirs_expected = [
      src,
      `${cwd}\\node_modules`,
      `${path.dirname(cwd)}\\node_modules`,
      'D:\\node_modules',
    ];
    const dirs_actual = resolver.getModulePaths(cwd);
    expect(dirs_actual).toEqual(expect.arrayContaining(dirs_expected));
  });

  it('can resolve node modules relative to absolute paths in "moduleDirectories" on Posix platforms', () => {
    jest.doMock('path', () => _path.posix);
    const path = require('path');
    const Resolver = require('../').default;

    const cwd = '/temp/project';
    const src = '/path/to/node_modules';
    const resolver = new Resolver(moduleMap, {
      moduleDirectories: [src, 'node_modules'],
    });
    const dirs_expected = [
      src,
      `${cwd}/node_modules`,
      `${path.dirname(cwd)}/node_modules`,
      '/node_modules',
    ];
    const dirs_actual = resolver.getModulePaths(cwd);
    expect(dirs_actual).toEqual(expect.arrayContaining(dirs_expected));
  });
});

describe('Resolver.getGlobalPaths()', () => {
  const _path = path;
  let moduleMap: IModuleMap;
  beforeEach(() => {
    moduleMap = ModuleMap.create('/');
  });

  it('return global paths with npm package', () => {
    jest.doMock('path', () => _path.posix);
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const globalPaths = resolver.getGlobalPaths('jest');
    for (const globalPath of globalPaths)
      expect(require.resolve.paths('jest')).toContain(globalPath);
  });

  it('return empty array with builtin module', () => {
    jest.doMock('path', () => _path.posix);
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const globalPaths = resolver.getGlobalPaths('fs');
    expect(globalPaths).toStrictEqual([]);
  });

  it('return global paths with absolute path', () => {
    jest.doMock('path', () => _path.posix);
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const globalPaths = resolver.getGlobalPaths('/');
    for (const globalPath of globalPaths)
      expect(require.resolve.paths('/')).toContain(globalPath);
  });

  it('return empty array with relative path', () => {
    jest.doMock('path', () => _path.posix);
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const globalPaths = resolver.getGlobalPaths('./');
    expect(globalPaths).toStrictEqual([]);
  });

  it('return empty array without module name', () => {
    jest.doMock('path', () => _path.posix);
    const resolver = new Resolver(moduleMap, {} as ResolverConfig);
    const globalPaths = resolver.getGlobalPaths();
    expect(globalPaths).toStrictEqual([]);
  });
});
