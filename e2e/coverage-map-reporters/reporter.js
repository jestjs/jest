/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('node:path');

module.exports = class {
  constructor(_globalConfig, {name}) {
    this.name = name;
  }

  onRunStart() {
    console.log(JSON.stringify({event: 'start', name: this.name}));
  }

  onRunComplete(_contexts, {coverageMap}) {
    const files = coverageMap
      ? Object.fromEntries(
          coverageMap
            .files()
            .map(file => [
              path.basename(file),
              coverageMap.fileCoverageFor(file).toSummary().lines.pct,
            ]),
        )
      : null;
    console.log(JSON.stringify({event: 'complete', files, name: this.name}));
  }
};
