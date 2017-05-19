/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

const SUPPORTED_PLATFORM_EXTS = {
  android: true,
  ios: true,
  native: true,
  web: true,
  windows: true,
};

// Extract platform extension: index.ios.js -> ios
function getPlatformExtension(
  file: string,
  platforms?: Array<string>,
): ?string {
  const last = file.lastIndexOf('.');
  const secondToLast = file.lastIndexOf('.', last - 1);
  if (secondToLast === -1) {
    return null;
  }
  const platform = file.substring(secondToLast + 1, last);
  // If an overriding platform array is passed, check that first

  if (platforms && platforms.indexOf(platform) !== -1) {
    return platform;
  }
  return SUPPORTED_PLATFORM_EXTS[platform] ? platform : null;
}

module.exports = getPlatformExtension;
