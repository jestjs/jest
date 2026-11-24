/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Measures what the default resolver costs per resolution once the fs cache
 * is warm, by resolving every package in the repo's node_modules from the
 * repo root, alternating cjs/esm conditions like a real run does.
 *
 * The raw `ResolverFactory` number is the floor: the gap between it and
 * `Resolver.findNodeModule` is jest-resolve's own overhead. A
 * `ResolverFactory` construction (`new` or `cloneWithOptions`) is a ~5µs
 * NAPI call - several warm resolutions' worth - so anything that puts one
 * back on the per-resolution path shows up here immediately.
 *
 * Run with: node packages/jest-resolve/__benchmarks__/test.js
 * (requires `yarn build:js`)
 */

'use strict';

const path = require('node:path');
const fs = require('graceful-fs');
const {ResolverFactory} = require('unrs-resolver');
const Resolver = require('../build').default;

const repoRoot = path.resolve(__dirname, '../../..');
const nodeModules = path.join(repoRoot, 'node_modules');

const specifiers = [];
for (const entry of fs.readdirSync(nodeModules)) {
  if (entry.startsWith('.')) continue;
  if (entry.startsWith('@')) {
    for (const scoped of fs.readdirSync(path.join(nodeModules, entry))) {
      specifiers.push(`${entry}/${scoped}`);
    }
  } else {
    specifiers.push(entry);
  }
}

const extensions = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.mts', '.cts'];
const cjsConditions = ['require', 'node', 'default'];
const esmConditions = ['import', 'module-sync', 'default'];

function resolveAllViaFindNodeModule() {
  let resolved = 0;
  for (const [i, specifier] of specifiers.entries()) {
    const result = Resolver.findNodeModule(specifier, {
      basedir: repoRoot,
      conditions: i % 2 === 0 ? cjsConditions : esmConditions,
      extensions,
      moduleDirectory: ['node_modules'],
    });
    if (result) resolved++;
  }
  return resolved;
}

const cjsFactory = new ResolverFactory({
  conditionNames: cjsConditions,
  extensions,
  modules: ['node_modules'],
});
const esmFactory = cjsFactory.cloneWithOptions({
  conditionNames: esmConditions,
  extensions,
  modules: ['node_modules'],
});

function resolveAllViaRawFactory() {
  let resolved = 0;
  for (const [i, specifier] of specifiers.entries()) {
    const factory = i % 2 === 0 ? cjsFactory : esmFactory;
    if (factory.sync(repoRoot, specifier).path) resolved++;
  }
  return resolved;
}

function bench(label, resolveAll, rounds) {
  resolveAll(); // warm the fs cache so the numbers measure CPU, not IO
  const start = process.hrtime.bigint();
  let resolved = 0;
  for (let round = 0; round < rounds; round++) {
    resolved = resolveAll();
  }
  const ns = Number(process.hrtime.bigint() - start);
  const perCall = ns / (rounds * specifiers.length);
  console.log(
    `${label.padEnd(26)} ${(ns / 1e6 / rounds).toFixed(2).padStart(8)} ms/round ${perCall.toFixed(0).padStart(6)} ns/resolution (${resolved}/${specifiers.length} resolved)`,
  );
}

const ROUNDS = 30;
console.log(`${specifiers.length} specifiers, ${ROUNDS} rounds\n`);
bench('Resolver.findNodeModule', resolveAllViaFindNodeModule, ROUNDS);
bench('raw ResolverFactory (floor)', resolveAllViaRawFactory, ROUNDS);
