/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {GlobalConfig} from 'types/Config';
import type {WatchPlugin, UsageData} from '../types';

export const filterInteractivePlugins = (
  watchPlugins: Array<WatchPlugin>,
  globalConfig: GlobalConfig,
): Array<WatchPlugin> => {
  const usageInfos = watchPlugins.map(
    p => p.getUsageInfo && p.getUsageInfo(globalConfig),
  );

  return watchPlugins.filter((plugin, i, array) => {
    if (usageInfos[i]) {
      const {key} = usageInfos[i];
      return !usageInfos.slice(i + 1).some(u => u && key === u.key);
    }

    return false;
  });
};

export const getSortedUsageRows = (
  watchPlugins: Array<WatchPlugin>,
  globalConfig: GlobalConfig,
): Array<UsageData> =>
  filterInteractivePlugins(watchPlugins, globalConfig)
    .sort((a: WatchPlugin, b: WatchPlugin) => {
      if (a.isInternal) {
        return -1;
      }

      const usageInfoA = a.getUsageInfo && a.getUsageInfo(globalConfig);
      const usageInfoB = b.getUsageInfo && b.getUsageInfo(globalConfig);

      if (usageInfoA && usageInfoB) {
        return usageInfoA.key.localeCompare(usageInfoB.key);
      }

      return 0;
    })
    .map(p => p.getUsageInfo && p.getUsageInfo(globalConfig))
    .filter(Boolean);
