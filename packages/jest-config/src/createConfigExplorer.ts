/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  CosmiconfigResult,
  Loaders,
  Options,
  PublicExplorer,
} from 'cosmiconfig';

type ExplorerOptions = Options & {
  applyPackagePropertyPathToConfiguration: boolean;
  metaConfigFilePath: string | null;
  moduleName: string;
};

type ExplorerConstructor = new (options: ExplorerOptions) => PublicExplorer;

// The public factory reads user cosmiconfig meta-configuration. Jest needs an
// explorer whose behavior can only be changed by Jest's own options. Keep the
// dependency pinned because this constructor is intentionally internal.
const {Explorer} = require('cosmiconfig/dist/Explorer.js') as {
  Explorer: ExplorerConstructor;
};

export default function createConfigExplorer(
  searchPlaces: Array<string>,
  loaders: Loaders,
  ignoreEmptySearchPlaces = true,
): PublicExplorer {
  return new Explorer({
    applyPackagePropertyPathToConfiguration: false,
    cache: false,
    ignoreEmptySearchPlaces,
    loaders,
    mergeImportArrays: true,
    mergeSearchPlaces: false,
    metaConfigFilePath: null,
    moduleName: 'jest',
    searchPlaces,
    searchStrategy: 'none',
    transform: (result: CosmiconfigResult) => result,
  });
}
