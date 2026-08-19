/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import H from '../constants';
import ModuleMap from '../ModuleMap';
import type {DuplicatesIndex, RawModuleMap} from '../types';

const rootDir = '/root';

function buildModuleMap(duplicates: DuplicatesIndex): ModuleMap {
  const raw: RawModuleMap = {
    duplicates,
    map: new Map(),
    mocks: new Map(),
    rootDir,
  };
  return new ModuleMap(raw);
}

function duplicatesFor(
  entries: Array<[name: string, platforms: Array<string>]>,
): DuplicatesIndex {
  return new Map(
    entries.map(([name, platforms]) => [
      name,
      new Map(
        platforms.map(platform => [
          platform,
          new Map([
            [`a/${name}.js`, H.MODULE],
            [`b/${name}.js`, H.MODULE],
          ]),
        ]),
      ),
    ]),
  );
}

describe('ModuleMap serialization', () => {
  it.each([
    ['one name, one platform', [['Foo', ['g']]]],
    [
      'several names, one platform each',
      [
        ['Foo', ['g']],
        ['Bar', ['g']],
      ],
    ],
    ['one name, several platforms', [['Foo', ['g', 'ios']]]],
    [
      'several names, several platforms',
      [
        ['Foo', ['g', 'ios']],
        ['Bar', ['g']],
      ],
    ],
  ] as Array<[string, Array<[string, Array<string>]>]>)(
    'round-trips duplicates through toJSON/fromJSON: %s',
    (_label, entries) => {
      const duplicates = duplicatesFor(entries);
      const restored = ModuleMap.fromJSON(buildModuleMap(duplicates).toJSON());

      expect(restored.getRawModuleMap().duplicates).toEqual(duplicates);
    },
  );

  it('reports duplicates as DuplicateHasteCandidatesError after a round-trip', () => {
    const original = buildModuleMap(duplicatesFor([['Foo', ['g']]]));
    const restored = ModuleMap.fromJSON(original.toJSON());

    expect(() => restored.getModule('Foo', 'g')).toThrow(
      ModuleMap.DuplicateHasteCandidatesError,
    );
  });

  it('round-trips an empty duplicates index', () => {
    const restored = ModuleMap.fromJSON(buildModuleMap(new Map()).toJSON());

    expect(restored.getRawModuleMap().duplicates).toEqual(new Map());
  });
});
