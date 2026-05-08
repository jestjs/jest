/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {SyntheticModule, type Context as VMContext} from 'node:vm';
import {invariant} from 'jest-util';
import {noop} from '../helpers';
import type {CjsExportsCache} from './CjsExportsCache';

// Build a SyntheticModule from a plain exports record. The set of names and
// the value *references* are snapshotted at construction time, so later
// `exportsObject[k] = v` re-assignments or key add/delete won't leak into
// `evaluate()`. This is a shallow snapshot - mutating an exported object
// (`exportsObject.x.foo = ...`) is still observable through `setExport`.
export function syntheticFromExports(
  identifier: string,
  context: VMContext,
  exportsObject: Record<string, unknown>,
): SyntheticModule {
  const entries = Object.entries(exportsObject);
  return new SyntheticModule(
    entries.map(([key]) => key),
    function () {
      for (const [key, value] of entries) {
        this.setExport(key, value);
      }
    },
    {context, identifier},
  );
}

export function buildJsonSyntheticModule(
  jsonText: string,
  identifier: string,
  context: VMContext,
): SyntheticModule {
  // JSON.parse runs in the body so a parse error surfaces during evaluate(),
  // matching Node's native JSON-module semantics.
  return new SyntheticModule(
    ['default'],
    function () {
      const obj = JSON.parse(jsonText);
      this.setExport('default', obj);
    },
    {context, identifier},
  );
}

// The body reads each import's namespace via `getDepNamespace`, which both the
// sync graph (closure over `scratch`) and the legacy path (closure over a
// pre-built `moduleLookup`) supply.
export function buildWasmSyntheticModule(
  wasmModule: WebAssembly.Module,
  identifier: string,
  context: VMContext,
  getDepNamespace: (importModule: string) => Record<string, unknown>,
): SyntheticModule {
  const exports = WebAssembly.Module.exports(wasmModule);
  const imports = WebAssembly.Module.imports(wasmModule);

  return new SyntheticModule(
    exports.map(({name}) => name),
    function () {
      const importsObject: WebAssembly.Imports = {};
      for (const {module: depSpec, name} of imports) {
        if (!importsObject[depSpec]) {
          importsObject[depSpec] = {};
        }
        const namespace = getDepNamespace(depSpec);
        importsObject[depSpec][name] = namespace[
          name
        ] as WebAssembly.ImportValue;
      }
      const wasmInstance = new WebAssembly.Instance(wasmModule, importsObject);
      for (const {name} of exports) {
        this.setExport(name, wasmInstance.exports[name]);
      }
    },
    {context, identifier},
  );
}

export function buildCoreSyntheticModule(
  moduleName: string,
  context: VMContext,
  requireCoreModule: (moduleName: string, supportPrefix: boolean) => unknown,
): SyntheticModule {
  const required = requireCoreModule(moduleName, true) as Record<
    string,
    unknown
  >;
  // should identifier be `node://${moduleName}`?
  return syntheticFromExports(moduleName, context, {
    ...required,
    default: required,
  });
}

// Builds a SyntheticModule wrapping a CJS module's `module.exports` for
// import-from-ESM. Merges cjs-module-lexer's static export list with the
// runtime keys of the actual exports object (lexer can miss
// `Object.assign`-style patterns).
export function buildCjsAsEsmSyntheticModule(
  from: string,
  modulePath: string,
  context: VMContext,
  requireModuleOrMock: (from: string, moduleName: string) => unknown,
  cjsExportsCache: Pick<CjsExportsCache, 'getExportsOf'>,
): SyntheticModule {
  const cjs = requireModuleOrMock(from, modulePath);
  const parsedExports = cjsExportsCache.getExportsOf(from, modulePath);

  // CJS modules can legally set `module.exports` to `null` or a primitive.
  const cjsRecord =
    typeof cjs === 'object' && cjs !== null
      ? (cjs as Record<string, unknown>)
      : null;

  const allCandidates = new Set([
    ...parsedExports,
    ...(cjsRecord ? Object.keys(cjsRecord) : []),
  ]);

  const cjsExports = [...allCandidates].filter(exportName => {
    // `default` is handled separately below as the whole module.exports.
    if (exportName === 'default') {
      return false;
    }
    return cjsRecord
      ? Object.hasOwnProperty.call(cjsRecord, exportName)
      : false;
  });

  return new SyntheticModule(
    [...cjsExports, 'default'],
    function () {
      for (const exportName of cjsExports) {
        this.setExport(exportName, (cjs as any)[exportName]);
      }
      // module.exports is the ESM default, matching Node's CJS-from-ESM behavior.
      // __esModule is not honored — see Node docs on named exports from CJS.
      this.setExport('default', cjs);
    },
    {context, identifier: modulePath},
  );
}

// On Node v22.21+ / v24.8+ a SyntheticModule starts in `'linked'` and the
// body runs synchronously even though `evaluate()` returns a Promise -
// return it sync so callers can store the actual module rather than a
// Promise that can poison the registry if microtask draining stalls. On
// older Node it starts `'unlinked'` and link/evaluate are genuinely async;
// fall back to the async path there (the async-only legacy ESM code paths
// handle the Promise return fine, and sync `require(esm)` doesn't exist on
// those versions anyway).
export function evaluateSyntheticModule(
  module: SyntheticModule,
): SyntheticModule | Promise<SyntheticModule> {
  if (module.status === 'unlinked') {
    return evaluateSyntheticModuleAsync(module);
  }
  module.evaluate().catch(noop);
  if (module.status === 'errored') {
    throw module.error;
  }
  invariant(
    module.status === 'evaluated',
    `Synthetic module ${module.identifier} did not evaluate synchronously (status="${module.status}"). This is a bug in Jest, please report it!`,
  );
  return module;
}

async function evaluateSyntheticModuleAsync(
  module: SyntheticModule,
): Promise<SyntheticModule> {
  await module.link(() => {
    throw new Error('This should never happen');
  });

  await module.evaluate();

  return module;
}
