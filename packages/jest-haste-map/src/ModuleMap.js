/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Path} from 'types/Config';
import type {
  HType,
  HTypeValue,
  MockData,
  ModuleMapData,
  RawModuleMap,
} from 'types/HasteMap';

const H: HType = require('./constants');

class ModuleMap {

  _map: ModuleMapData;
  _mocks: MockData;

  constructor(map: ModuleMapData, mocks: MockData) {
    this._map = map;
    this._mocks = mocks;
  }

  getModule(
    name: string,
    platform: ?string,
    supportsNativePlatform: ?boolean,
    type: ?HTypeValue,
  ): ?Path {
    if (!type) {
      type = H.MODULE;
    }

    const map = this._map[name];
    if (map) {
      let module = platform && map[platform];
      if (!module && map[H.NATIVE_PLATFORM] && supportsNativePlatform) {
        module = map[H.NATIVE_PLATFORM];
      } else if (!module) {
        module = map[H.GENERIC_PLATFORM];
      }
      if (module && module[H.TYPE] === type) {
        return module[H.PATH];
      }
    }

    return null;
  }

  getPackage(
    name: string,
    platform: ?string,
    supportsNativePlatform: ?boolean,
  ): ?Path {
    return this.getModule(name, platform, null, H.PACKAGE);
  }

  getMockModule(name: string): ?Path {
    return this._mocks[name];
  }

  getRawModuleMap(): RawModuleMap {
    return {
      map: this._map,
      mocks: this._mocks,
    };
  }

}

module.exports = ModuleMap;
