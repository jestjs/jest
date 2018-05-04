/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import util from 'util';

export default function formatWhyRunning(whyRunning) {
  const whyRunningArray = [];
  const fakeLogger = {
    error(...args) {
      whyRunningArray.push(util.format(...args));
    },
  };

  whyRunning(fakeLogger);

  return whyRunningArray
    .join('\n')
    .split('\n\n')
    .filter(entry => {
      if (entry.startsWith('There are') || !entry) {
        return false;
      }

      return entry.split('\n').some(l => l.includes('this._execModule('));
    })
    .map(entry => {
      const [title, ...lines] = entry.split('\n');

      const entries = lines
        .map(line => line.split(/\s+-\s+/))
        .map(([file, line]) => ({file, line}));

      return {
        entries,
        title: title.replace('# ', ''),
      };
    });
}
