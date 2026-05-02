/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {MockMetadata, ModuleMocker} from 'jest-mock';
import type MockState from './MockState';
import type ModuleRegistries from './ModuleRegistries';
import type Resolution from './Resolution';

export interface GenerateMockDeps {
  resolution: Resolution;
  mockState: MockState;
  moduleMocker: ModuleMocker;
  registries: ModuleRegistries;
  // The real-module require used to populate metadata. Wired to
  // `CjsLoader.requireModule` at construction time. Wraps in scratch
  // registries to avoid polluting the real module/mock caches.
  requireModule: (from: string, moduleName: string) => unknown;
}

export function generateMock<T>(
  from: string,
  moduleName: string,
  deps: GenerateMockDeps,
): T {
  const {resolution, mockState, moduleMocker, registries, requireModule} = deps;

  const modulePath =
    resolution.resolveCjsStub(from, moduleName) ||
    resolution.resolveCjs(from, moduleName);

  if (!mockState.hasMockMetadata(modulePath)) {
    // This allows us to handle circular dependencies while generating an
    // automock
    mockState.setMockMetadata(modulePath, moduleMocker.getMetadata({}) || {});

    // In order to avoid it being possible for automocking to potentially
    // cause side-effects within the module environment, we need to execute
    // the module in isolation. This could cause issues if the module being
    // mocked has calls into side-effectful APIs on another module.
    const moduleExports = registries.withScratchRegistries(() =>
      requireModule(from, moduleName),
    );

    const mockMetadata = moduleMocker.getMetadata(moduleExports);
    if (mockMetadata == null) {
      throw new Error(
        `Failed to get mock metadata: ${modulePath}\n\n` +
          'See: https://jestjs.io/docs/manual-mocks#content',
      );
    }
    mockState.setMockMetadata(modulePath, mockMetadata);
  }

  const moduleMock = moduleMocker.generateFromMetadata<T>(
    mockState.getMockMetadata(modulePath)! as MockMetadata<T>,
  );
  return mockState.notifyMockGenerated(modulePath, moduleMock);
}
