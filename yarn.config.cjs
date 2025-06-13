/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-check
// See: https://yarnpkg.com/features/constraints

/** @type {import('@yarnpkg/types')} */
const {defineConfig} = require('@yarnpkg/types');

const EXCEPTIONS = new Set([
  // root needs to stay on 18.x
  '@types/node',
]);

module.exports = defineConfig({
  async constraints({Yarn}) {
    const allNonPeerDeps = Yarn.dependencies().filter(
      d => d.type !== 'peerDependencies',
    );

    // 1. Enforce same dependency version across workspaces (with exceptions)
    for (const dependency of Yarn.dependencies()) {
      const {ident, type} = dependency;
      if (type === 'peerDependencies') continue;
      if (EXCEPTIONS.has(ident)) continue;
      const allDeps = allNonPeerDeps.filter(d => d.ident === ident);
      const uniqueRanges = [...new Set(allDeps.map(d => d.range))];
      if (uniqueRanges.length > 1) {
        for (const d of allDeps) {
          d.error(
            `Dependency \`${ident}\` should have the same version across all workspaces (found: ${uniqueRanges.join(', ')})`,
          );
        }
      }
    }

    // 2. Prevent dependency in both dependencies and devDependencies
    for (const workspace of Yarn.workspaces()) {
      const deps = workspace.manifest.dependencies;
      const devDeps = workspace.manifest.devDependencies;
      if (deps == null || devDeps == null) {
        continue;
      }
      for (const devDep of Object.keys(devDeps)) {
        if (deps[devDep]) {
          workspace.error(
            `Dependency \`${devDep}\` appears in both dependencies and devDependencies`,
          );
        }
      }
    }

    // 3. Enforce license field for public workspaces, remove for private
    for (const workspace of Yarn.workspaces()) {
      if (workspace.manifest.private === true) {
        workspace.unset('license');
      } else {
        workspace.set('license', 'MIT');
      }
    }

    // 4. Enforce repository field for public workspaces, remove for private
    for (const workspace of Yarn.workspaces()) {
      if (workspace.manifest.private === true) {
        workspace.unset('repository');
      } else {
        workspace.set(['repository', 'type'], 'git');
        workspace.set(
          ['repository', 'url'],
          'https://github.com/jestjs/jest.git',
        );
        workspace.set(['repository', 'directory'], workspace.cwd);
      }
    }

    // 5. Enforce publishConfig.access for public workspaces, remove for private
    for (const workspace of Yarn.workspaces()) {
      if (workspace.manifest.private === true) {
        workspace.unset('publishConfig');
      } else {
        workspace.set(['publishConfig', 'access'], 'public');
      }
    }

    // 6. Enforce engines.node for public workspaces
    for (const workspace of Yarn.workspaces()) {
      if (workspace.manifest.private !== true) {
        workspace.set(
          ['engines', 'node'],
          '^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0',
        );
      }
    }

    // 7. Enforce main/types fields to start with ./
    for (const workspace of Yarn.workspaces()) {
      for (const field of ['main', 'types']) {
        const value = workspace.manifest[field];
        if (typeof value === 'string' && !value.startsWith('./')) {
          workspace.set(field, `./${value}`);
        }
      }
    }
  },
});
