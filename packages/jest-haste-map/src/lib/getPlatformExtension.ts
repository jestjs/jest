/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const SUPPORTED_PLATFORM_EXTS = new Set(['android', 'ios', 'native', 'web']);

// Extract platform extension: index.ios.js -> ios
export default function getPlatformExtension(
  file: string,
  platforms?: Array<string>,
): string | null {
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
  return SUPPORTED_PLATFORM_EXTS.has(platform) ? platform : null;
}
