/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dirname, extname} from 'path';
// @ts-expect-error: experimental, not added to the types
import {SyntheticModule} from 'vm';
import {findClosestPackageJson, readPackageCached} from './fileWalkers';

const runtimeSupportsVmModules = typeof SyntheticModule === 'function';

const cachedFileLookups = new Map<string, boolean>();
const cachedDirLookups = new Map<string, boolean>();
const cachedChecks = new Map<string, boolean>();

export function clearCachedLookups(): void {
  cachedFileLookups.clear();
  cachedDirLookups.clear();
  cachedChecks.clear();
}

export default function cachedShouldLoadAsEsm(
  path: string,
  extensionsToTreatAsEsm: Array<string>,
): boolean {
  if (!runtimeSupportsVmModules) {
    return false;
  }

  let cachedLookup = cachedFileLookups.get(path);

  if (cachedLookup === undefined) {
    cachedLookup = shouldLoadAsEsm(path, extensionsToTreatAsEsm);
    cachedFileLookups.set(path, cachedLookup);
  }

  return cachedLookup;
}

// this is a bad version of what https://github.com/nodejs/modules/issues/393 would provide
function shouldLoadAsEsm(
  path: string,
  extensionsToTreatAsEsm: Array<string>,
): boolean {
  const extension = extname(path);

  if (extension === '.mjs') {
    return true;
  }

  if (extension === '.cjs') {
    return false;
  }

  if (extension !== '.js') {
    return extensionsToTreatAsEsm.includes(extension);
  }

  const cwd = dirname(path);

  let cachedLookup = cachedDirLookups.get(cwd);

  if (cachedLookup === undefined) {
    cachedLookup = cachedPkgCheck(cwd);
    cachedFileLookups.set(cwd, cachedLookup);
  }

  return cachedLookup;
}

function cachedPkgCheck(cwd: string): boolean {
  const pkgPath = findClosestPackageJson(cwd);
  if (!pkgPath) {
    return false;
  }

  let hasModuleField = cachedChecks.get(pkgPath);
  if (hasModuleField != null) {
    return hasModuleField;
  }

  try {
    const pkg = readPackageCached(pkgPath);
    hasModuleField = pkg.type === 'module';
  } catch {
    hasModuleField = false;
  }

  cachedChecks.set(pkgPath, hasModuleField);
  return hasModuleField;
}
