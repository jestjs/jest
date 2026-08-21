/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {
  SourceTextModule,
  type SyntheticModule,
  type Context as VMContext,
  type Module as VMModule,
} from 'node:vm';
import type {JestEnvironment, JestImportMeta} from '@jest/environment';
import {invariant, isPromise} from 'jest-util';
import {noop} from '../helpers';
import type {CjsExportsCache} from './CjsExportsCache';
import type {FileCache} from './FileCache';
import type {JestGlobals} from './JestGlobals';
import type {MockState} from './MockState';
import {CjsParseError} from './ModuleExecutor';
import type {ModuleRegistries} from './ModuleRegistries';
import {type Resolution, isWasm} from './Resolution';
import type {TestState} from './TestState';
import type {TransformCache, TransformOptions} from './TransformCache';
import type {CoreModuleProvider} from './cjsRequire';
import type {
  ESModule,
  ImportAttributes,
  JestModule,
  ModuleRegistry,
} from './moduleTypes';
import {
  runtimeSupportsVmModules,
  supportsSyncEvaluate,
} from './nodeCapabilities';
import {
  buildCjsAsEsmSyntheticModule,
  buildCoreSyntheticModule,
  buildJsonSyntheticModule,
  buildWasmSyntheticModule,
  evaluateSyntheticModule,
  syntheticFromExports,
} from './syntheticBuilders';

interface VMModuleWithAsyncGraph extends VMModule {
  hasAsyncGraph?: () => boolean;
  hasTopLevelAwait?: () => boolean;
  moduleRequests?: ReadonlyArray<{
    specifier: string;
    attributes: ImportAttributes;
    phase?: string;
  }>;
  linkRequests?: (deps: ReadonlyArray<VMModule>) => void;
  instantiate?: () => void;
}

// `'sync-required'` is `require(esm)` (must be loaded synchronously, throw a
// typed error on edges that would normally bail). `'sync-preferred'` is the
// fast path for `await import()` (try sync; fall back to the legacy async
// loader on any unsupported edge).
export type SyncEsmMode = 'sync-preferred' | 'sync-required';

// Returned by sync-graph methods when a dependency or condition prevents
// synchronous loading. Callers propagate it upward; the top-level
// `tryLoadGraphSync` caller falls back to the legacy async path.
export const LOAD_ASYNC = 'load-async' as const;
type LoadAsync = typeof LOAD_ASYNC;

type WorklistEntry = {
  cacheKey: string;
  modulePath: string;
};

type ResolvedSyncSpecifier = {
  cacheKey: string;
  enqueue: WorklistEntry | null;
  modulePath: string;
};

// Shape of the third arg Node passes to the `module.link` callback. TC39 final
// is `{attributes}`; legacy was `{assert}`. `@types/node@18` only types the
// legacy field, so we declare both ourselves.
// TODO(jest next major): drop `assert` once we require Node 22+.
type ModuleLinkExtra = {
  assert?: ImportAttributes;
  attributes?: ImportAttributes;
};

// Source-text entries carry their dep cacheKeys (used for `linkRequests`).
// `'prelinked'` covers everything that arrives already linked - mocks, core,
// JSON, wasm, @jest/globals, plus modules adopted from the registry, which
// may be `SourceTextModule`s rather than `SyntheticModule`s - so it never
// appears in the link-requests pass.
type ScratchEntry =
  | {
      kind: 'source';
      cacheKey: string;
      module: VMModuleWithAsyncGraph;
      deps: Array<string>;
    }
  | {kind: 'prelinked'; cacheKey: string; module: VMModuleWithAsyncGraph};

// `SourceTextModule#hasAsyncGraph()` lets us prove a graph is sync-evaluable.
// `SyntheticModule` does not expose it but is by definition sync (the user
// callback is sync), so treat its absence as "not async".
function moduleHasAsyncGraph(module: VMModuleWithAsyncGraph): boolean {
  return typeof module.hasAsyncGraph === 'function'
    ? module.hasAsyncGraph()
    : false;
}

// Mirrors Node's `require(esm)` error code so user catches work uniformly.
function makeRequireAsyncError(
  modulePath: string,
  detail: string,
): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(
    `require() cannot be used to load ES Module ${modulePath}: ${detail}`,
  );
  error.code = 'ERR_REQUIRE_ASYNC_MODULE';
  return error;
}

function makeRequireCycleError(
  modulePath: string,
  requiredFrom: string | undefined,
): NodeJS.ErrnoException {
  const fromPart = requiredFrom === undefined ? '' : ` (from ${requiredFrom})`;
  const error: NodeJS.ErrnoException = new Error(
    `Cannot require() ES Module ${modulePath} in a cycle.${fromPart} A cycle involving require(esm) is not allowed to maintain invariants mandated by the ECMAScript specification. Try making at least part of the dependency in the graph lazily loaded.`,
  );
  error.code = 'ERR_REQUIRE_CYCLE_MODULE';
  return error;
}

// Decode a `data:` URI specifier into its mime type and decoded code/body.
// `application/wasm` returns a Buffer; everything else returns a UTF-8 string.
const dataURIRegex =
  /^data:(?<mime>[^;,]*)(?<parameters>(?:;[^;,]*)*),(?<code>.*)$/;

// Node's own mediatype extraction (lib/internal/modules/esm/load.js) - the
// capture is both the format-decision input and what the rejection message
// echoes, and a failed capture reports the literal string "null".
const nodeMediatypeRegex = /^data:([^/]+\/[^;,]+)[^,]*,/;

// Node's mimeToFormat: the JavaScript mime tolerates surrounding spaces and
// matches case-insensitively (text/ and application/ alike), while
// application/json and application/wasm require an exact match.
const javaScriptMimeRegex = /^ *(?:text|application)\/javascript *$/i;

function makeInvalidUrlError(): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new TypeError('Invalid URL');
  error.code = 'ERR_INVALID_URL';
  return error;
}

// The `data-urls` package implements the full WHATWG data URL processor,
// but it is too heavy for this limited use case - it drags in `whatwg-url`
// and its Unicode tables. See https://github.com/jsdom/data-urls/issues/7.

// The WHATWG forgiving percent-decode: valid %XX escapes decode to their
// byte, anything else passes through as its UTF-8 bytes instead of throwing.
// Literal spans encode in one operation each, so an escape-free payload is a
// single allocation.
function forgivingPercentDecode(input: string): Buffer {
  if (!input.includes('%')) {
    return Buffer.from(input, 'utf8');
  }
  const chunks: Array<Buffer> = [];
  let literalStart = 0;
  let index = 0;
  while (index < input.length) {
    if (
      input[index] === '%' &&
      /^[0-9A-Fa-f]{2}$/.test(input.slice(index + 1, index + 3))
    ) {
      if (literalStart < index) {
        chunks.push(Buffer.from(input.slice(literalStart, index), 'utf8'));
      }
      chunks.push(
        Buffer.of(Number.parseInt(input.slice(index + 1, index + 3), 16)),
      );
      index += 3;
      literalStart = index;
    } else {
      index++;
    }
  }
  if (literalStart < input.length) {
    chunks.push(Buffer.from(input.slice(literalStart), 'utf8'));
  }
  return Buffer.concat(chunks);
}

// The WHATWG forgiving base64: ASCII whitespace is stripped, up to two
// trailing `=` are allowed, and anything else outside the base64 alphabet
// (or a leftover length of 1 mod 4) is an invalid URL.
function forgivingBase64Decode(input: string): Buffer {
  let data = input.replaceAll(/[\t\n\f\r ]/g, '');
  if (data.length % 4 === 0) {
    data = data.replace(/={1,2}$/, '');
  }
  if (data.length % 4 === 1 || !/^[A-Za-z0-9+/]*$/.test(data)) {
    throw makeInvalidUrlError();
  }
  return Buffer.from(data, 'base64');
}

function parseDataUri(specifier: string): {
  mime: string;
  code: string | Buffer;
} {
  // The URL parser strips ASCII tab and newline from the input entirely, and
  // the fragment starts at the first # - a fragment before the comma leaves
  // the data: URL without a payload at all.
  const serialized = specifier.replaceAll(/[\t\n\r]/g, '').split('#', 1)[0];
  const match = serialized.match(dataURIRegex);
  if (!match || !match.groups) {
    throw makeInvalidUrlError();
  }
  // The payload decodes before the format check, so an invalid body wins
  // over an unknown mime type. Mediatype parameters are case-insensitive and
  // unknown ones are ignored; base64 applies only as the final parameter.
  const parameters = match.groups.parameters.split(';').slice(1);
  // Spaces are the only whitespace that can surround the token: the URL
  // parser strips tab and newline and percent-encodes everything else.
  const isBase64 =
    parameters
      .at(-1)
      ?.replaceAll(/^ +| +$/g, '')
      .toLowerCase() === 'base64';
  const decodedBody = isBase64
    ? forgivingBase64Decode(
        forgivingPercentDecode(match.groups.code).toString(),
      )
    : forgivingPercentDecode(match.groups.code);
  const mediatype = serialized.match(nodeMediatypeRegex)?.[1] ?? null;
  let mime: string | null = null;
  if (mediatype !== null) {
    if (javaScriptMimeRegex.test(mediatype)) {
      mime = 'text/javascript';
    } else if (
      mediatype === 'application/json' ||
      mediatype === 'application/wasm'
    ) {
      mime = mediatype;
    }
  }
  if (mime === null) {
    const error: NodeJS.ErrnoException = new RangeError(
      `Unknown module format: ${mediatype} for URL ${specifier}`,
    );
    error.code = 'ERR_UNKNOWN_MODULE_FORMAT';
    throw error;
  }
  if (mime === 'application/wasm') {
    if (parameters.length === 0) throw new Error('Missing data URI encoding');
    if (!isBase64) {
      throw new Error(`Invalid data URI encoding: ${parameters.join(';')}`);
    }
    return {code: decodedBody, mime};
  }
  return {code: decodedBody.toString(), mime};
}

const urlSchemeRegex = /^[A-Za-z][A-Za-z0-9+.-]*:/;

// Mirrors Node's `validateAttributes` in lib/internal/modules/esm/assert.js.
// The only deliberate divergence: missing `type: 'json'` warns instead of
// throwing — see the JSON branch below.
const warnedMissingJsonAttributePairs = new Set<string>();
// Soft cap so a long-lived process (watch mode, --runInBand) can't grow the
// set without bound. When we hit it we drop everything; users see at most one
// extra repeated warning per pair, which is benign.
const MAX_WARNED_PAIRS = 10_000;

function isJsonModule(modulePath: string): boolean {
  return (
    modulePath.endsWith('.json') ||
    modulePath.startsWith('data:application/json')
  );
}

// Avoid dumping the full payload of data: URIs (or other very long specifiers)
// into stderr.
function describeForWarning(modulePath: string): string {
  if (modulePath.startsWith('data:')) {
    const comma = modulePath.indexOf(',');
    if (comma > 0) return `${modulePath.slice(0, comma)},…`;
  }
  return modulePath;
}

function makeImportAttributeError(
  code:
    | 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED'
    | 'ERR_IMPORT_ATTRIBUTE_MISSING'
    | 'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
  message: string,
): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new TypeError(message);
  error.code = code;
  return error;
}

export function validateImportAttributes(
  modulePath: string,
  attributes: ImportAttributes,
  referencingIdentifier: string,
): void {
  for (const key of Object.keys(attributes)) {
    if (key !== 'type') {
      throw makeImportAttributeError(
        'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED',
        `Import attribute "${key}" with value "${attributes[key]}" is not supported (importing "${modulePath}" from ${referencingIdentifier})`,
      );
    }
  }

  const declaredType = attributes.type;
  const isJson = isJsonModule(modulePath);

  if (isJson) {
    if (declaredType === undefined) {
      // TODO(jest next major): match Node and throw
      // ERR_IMPORT_ATTRIBUTE_MISSING here. Until then, warn so existing users
      // without `with { type: 'json' }` keep working.
      const dedupeKey = `${referencingIdentifier}::${modulePath}`;
      if (!warnedMissingJsonAttributePairs.has(dedupeKey)) {
        if (warnedMissingJsonAttributePairs.size >= MAX_WARNED_PAIRS) {
          warnedMissingJsonAttributePairs.clear();
        }
        warnedMissingJsonAttributePairs.add(dedupeKey);
        const moduleLabel = describeForWarning(modulePath);
        console.warn(
          'Jest: importing JSON without an import attribute is deprecated and will be a hard error in the next major. ' +
            `Update the import of "${moduleLabel}" (from ${referencingIdentifier}): ` +
            "use `with { type: 'json' }` for static imports, or pass " +
            "`{ with: { type: 'json' } }` as the second argument to dynamic `import()`.",
        );
      }
      return;
    }
    if (declaredType !== 'json') {
      throw makeImportAttributeError(
        'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
        `Module "${modulePath}" is not of type "${declaredType}"`,
      );
    }
    return;
  }

  // Non-JSON (implicit-type) module. Per HTML spec, the default type cannot
  // be re-asserted, so any explicit `type` attribute is rejected.
  if (declaredType !== undefined) {
    throw makeImportAttributeError(
      'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
      `Module "${modulePath}" is not of type "${declaredType}"`,
    );
  }
}

const ESM_TRANSFORM_OPTIONS: TransformOptions = {
  isInternalModule: false,
  supportsDynamicImport: true,
  supportsExportNamespaceFrom: true,
  supportsStaticESM: true,
  supportsTopLevelAwait: true,
};

type SplitSpecifier = {
  pathOrSpecifier: string;
  suffix: string;
};

// The scheme is case-insensitive and the authority is optional, so
// `file:/tmp/a.mjs` and `FILE:///tmp/a.mjs` are the same URL as
// `file:///tmp/a.mjs` - all three have to reach `fileURLToPath` rather than
// the package resolver.
const fileSchemeRegex = /^file:/i;

// A `?` or `#` in an import specifier is a query/fragment delimiter, never a
// filename character: the fragment starts at the first `#`, the query at the
// first `?` before it. `data:` URIs pass through whole - their `?`/`#` belong
// to the URI payload.
function splitQueryAndFragment(specifier: string): SplitSpecifier {
  if (specifier.startsWith('data:')) {
    return {pathOrSpecifier: specifier, suffix: ''};
  }
  if (fileSchemeRegex.test(specifier)) {
    const url = new URL(specifier);
    return {
      pathOrSpecifier: fileURLToPath(url),
      suffix: url.search + url.hash,
    };
  }
  const hashIndex = specifier.indexOf('#');
  const beforeFragment =
    hashIndex === -1 ? specifier : specifier.slice(0, hashIndex);
  const queryIndex = beforeFragment.indexOf('?');
  const splitIndex = queryIndex === -1 ? hashIndex : queryIndex;
  if (splitIndex === -1) {
    return {pathOrSpecifier: specifier, suffix: ''};
  }
  return {
    pathOrSpecifier: specifier.slice(0, splitIndex),
    suffix: specifier.slice(splitIndex),
  };
}

// ESM registry keys are serialized URLs, matching Node's per-URL module
// instancing: `?a`/`?a` share an instance while `?b`, `#frag` and the plain
// form are all distinct. Reading the suffix back off `search`/`hash` applies
// the normalization Node's resolver applies: non-ASCII and spaces
// percent-encode, and an empty `?` or `#` drops out, so `./a.mjs?` names the
// same instance as `./a.mjs`.
function fileCacheKey(modulePath: string, suffix: string): string {
  const baseUrl = pathToFileURL(modulePath);
  if (suffix === '') return baseUrl.href;
  const url = new URL(suffix, baseUrl);
  return baseUrl.href + url.search + url.hash;
}

function makeUnknownBuiltinError(specifier: string): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(
    `No such built-in module: ${specifier}`,
  );
  error.code = 'ERR_UNKNOWN_BUILTIN_MODULE';
  return error;
}

// Every builtin has a `node:`-prefixed spelling, but not every builtin has a
// bare one - `node:sea`, `node:sqlite`, `node:test` and `node:test/reporters`
// exist only with the prefix. Prefixing is therefore the total direction.
function canonicalCoreSpecifier(specifier: string): string {
  return specifier.startsWith('node:') ? specifier : `node:${specifier}`;
}

export interface EsmLoaderOptions {
  resolution: Resolution;
  fileCache: FileCache;
  transformCache: TransformCache;
  registries: ModuleRegistries;
  mockState: MockState;
  environment: JestEnvironment;
  cjsExportsCache: CjsExportsCache;
  coreModule: CoreModuleProvider;
  jestGlobals: JestGlobals;
  shouldLoadAsEsm: (modulePath: string) => boolean;
  requireModuleOrMock: (from: string, moduleName: string) => unknown;
  testState: TestState;
  testPath: string;
}

export class EsmLoader {
  private readonly resolution: Resolution;
  private readonly fileCache: FileCache;
  private readonly transformCache: TransformCache;
  private readonly registries: ModuleRegistries;
  private readonly mockState: MockState;
  private readonly environment: JestEnvironment;
  private readonly cjsExportsCache: CjsExportsCache;
  private readonly coreModule: CoreModuleProvider;
  private readonly jestGlobals: JestGlobals;
  private readonly shouldLoadAsEsm: (modulePath: string) => boolean;
  private readonly requireModuleOrMock: (
    from: string,
    moduleName: string,
  ) => unknown;
  private readonly testState: TestState;
  private readonly testPath: string;
  private readonly requireFacades = new WeakMap<ESModule, ESModule>();
  // Every cacheKey popped by a sync walk that is still on the stack. Walks
  // nest (a CJS body executing mid-walk can require() an unrelated ESM root),
  // so this is a stack of one entry per walk rather than a single Set. Each
  // walk records the registry it ran against: an isolation overlay or an
  // automock scratch registry is a separate instance space, so a key match
  // across registries is a fresh build, not a cycle.
  private readonly activeSyncWalks: Array<{
    registry: Map<string, JestModule>;
    keys: Set<string>;
    rootKey: string;
  }> = [];
  // Used only by the legacy async path; deletable when min-Node ≥ v24.9
  // (delete the block at the bottom of this file too - eslint/tsc will
  // surface anything else that becomes unused).
  private readonly linkingMap = new WeakMap<JestModule, Promise<unknown>>();
  private readonly evaluatingMap = new WeakMap<JestModule, Promise<void>>();

  constructor(options: EsmLoaderOptions) {
    this.resolution = options.resolution;
    this.fileCache = options.fileCache;
    this.transformCache = options.transformCache;
    this.registries = options.registries;
    this.mockState = options.mockState;
    this.environment = options.environment;
    this.cjsExportsCache = options.cjsExportsCache;
    this.coreModule = options.coreModule;
    this.jestGlobals = options.jestGlobals;
    this.shouldLoadAsEsm = options.shouldLoadAsEsm;
    this.requireModuleOrMock = options.requireModuleOrMock;
    this.testState = options.testState;
    this.testPath = options.testPath;
  }

  // `'load-async'` means the sync graph could not be completed — a concurrent
  // `await import()` is mid-flight, a dependency is async-only, etc. Surface
  // as ERR_REQUIRE_ESM with actionable context.
  //
  // Root-level mocks (`jest.unstable_mockModule(spec)` then `require(spec)`)
  // are not consulted - driving a SyntheticModule from `unlinked` to
  // `evaluated` needs the async link()/evaluate() pair. Transitive-dep mocks
  // still apply via the graph walker.
  requireEsmModule<T>(modulePath: string, requiredFrom?: string): T {
    const module = this.tryLoadGraphSync(
      modulePath,
      '',
      'sync-required',
      requiredFrom,
    );
    if (module === LOAD_ASYNC) {
      const error: NodeJS.ErrnoException = new Error(
        `Cannot require() ES Module ${modulePath} synchronously: it is currently being loaded by a concurrent \`import()\`. Await that import before calling require(), or import this module instead of requiring it.`,
      );
      error.code = 'ERR_REQUIRE_ESM';
      throw error;
    }
    return this.requireResultFromModule(module) as T;
  }

  // Mirrors Node's `populateCJSExportsFromESM`: a `'module.exports'` named
  // export wins outright; a module without a `default` export - or one that
  // defines its own `__esModule`, which users may set to override tooling
  // detection - hands back the raw namespace. Everything else gets a facade
  // namespace carrying `__esModule: true`, so transpiled consumers that pick
  // `mod.__esModule ? mod.default : mod` see require()d real ESM as ESM.
  requireResultFromModule(module: ESModule): unknown {
    const namespace = module.namespace as Record<string, unknown>;
    if ('module.exports' in namespace) {
      return namespace['module.exports'];
    }
    // The facade needs `linkRequests`/`instantiate` and a synchronously
    // settling evaluate - the capabilities `require(esm)` itself is gated on.
    // Below that gate this is reached only through `require.cache` reads,
    // which keep handing out the raw namespace.
    if (
      !supportsSyncEvaluate ||
      module.status !== 'evaluated' ||
      !('default' in namespace) ||
      '__esModule' in namespace
    ) {
      return namespace;
    }
    return this.requireFacadeFor(module).namespace;
  }

  // Node builds the facade as a real source-text module rather than a copy or
  // a Proxy - re-exporting keeps the original's bindings live and enumerable
  // with no per-access overhead. The original is already evaluated and the
  // facade body has no top-level await, so evaluation completes synchronously.
  private requireFacadeFor(module: ESModule): ESModule {
    const cached = this.requireFacades.get(module);
    if (cached) return cached;
    const facade: VMModuleWithAsyncGraph = new SourceTextModule(
      "export * from 'original';\nexport {default} from 'original';\nexport const __esModule = true;",
      {
        context: this.getContext(),
        identifier: `jest-require-facade:${module.identifier}`,
      },
    );
    invariant(
      typeof facade.linkRequests === 'function' &&
        typeof facade.instantiate === 'function',
      'linkRequests/instantiate unavailable on the require facade',
    );
    facade.linkRequests([module]);
    facade.instantiate();
    facade.evaluate().catch(noop);
    invariant(
      facade.status === 'evaluated',
      `Expected the require facade for ${module.identifier} to evaluate synchronously, but its status is "${facade.status}". This is a bug in Jest, please report it!`,
    );
    this.requireFacades.set(module, facade);
    return facade;
  }

  // Public for unit-test access. Production callers reach the sync graph
  // through `requireEsmModule` (sync require entry) or via `loadEsmModule`
  // (the legacy async entry, which first-tries this).
  tryLoadGraphSync(
    rootPath: string,
    rootSuffix: string,
    mode: SyncEsmMode,
    requiredFrom?: string,
  ): ESModule | LoadAsync {
    this.testState.throwIfTornDown(
      'You are trying to `import` a file after the Jest environment has been torn down.',
    );

    const registry = this.registries.getActiveEsmRegistry();
    const {cacheKey: rootKey, modulePath: canonicalRootPath} =
      this.canonicalizeRoot(rootPath, rootSuffix);

    const cached = registry.get(rootKey);
    if (cached) {
      if (cached instanceof Promise) return LOAD_ASYNC;
      // The legacy `loadEsmModule` source-text branch does `registry.set`
      // while the `SourceTextModule` is still `'unlinked'` (link runs later
      // in `linkAndEvaluateModule`); accessing `.namespace` on a non-evaluated
      // module throws `ERR_VM_MODULE_STATUS`. So: reuse `'evaluated'`,
      // rethrow `'errored'`, evaluate `'linked'` (already instantiated, just
      // never evaluated), and bail on everything still being linked.
      if (cached.status === 'evaluated') return cached as ESModule;
      if (cached.status === 'errored') throw cached.error;
      if (cached.status === 'linked') {
        return this.evaluateLinkedModule(cached, mode);
      }
      // `'unlinked'` / `'linking'` / `'evaluating'`. When the key belongs to
      // a walk still on the stack this is a require() of a module whose own
      // evaluation is in progress - a cycle, not a concurrent import().
      if (
        mode === 'sync-required' &&
        this.isReEnteringActiveWalk(rootKey, registry)
      ) {
        throw makeRequireCycleError(canonicalRootPath, requiredFrom);
      }
      return LOAD_ASYNC;
    }

    // A require() re-entering a graph that is still being walked would build
    // and evaluate a second copy of every uncommitted module (scratch entries
    // reach the registry only after the root instantiates). Node throws
    // ERR_REQUIRE_CYCLE_MODULE here; a dynamic import() of the same shape is
    // a legal ESM cycle, so `'sync-preferred'` is exempt.
    if (
      mode === 'sync-required' &&
      this.isReEnteringActiveWalk(rootKey, registry)
    ) {
      throw makeRequireCycleError(canonicalRootPath, requiredFrom);
    }

    const context = this.getContext();

    if (this.transformCache.hasMutex(rootKey)) return LOAD_ASYNC;

    const scratch = new Map<string, ScratchEntry>();
    const worklist: Array<WorklistEntry> = [
      {cacheKey: rootKey, modulePath: canonicalRootPath},
    ];

    const activeWalk = new Set<string>();
    this.activeSyncWalks.push({keys: activeWalk, registry, rootKey});
    try {
      return this.walkGraphSync({
        activeWalk,
        context,
        mode,
        registry,
        rootKey,
        scratch,
        worklist,
      });
    } finally {
      this.activeSyncWalks.pop();
    }
  }

  // Node resolves a core specifier with a query or fragment as a builtin
  // lookup of the whole string, which no builtin matches.
  private canonicalizeRoot(
    rootPath: string,
    rootSuffix: string,
  ): WorklistEntry {
    if (this.resolution.isCoreModule(rootPath)) {
      const canonical = canonicalCoreSpecifier(rootPath);
      if (rootSuffix !== '') {
        throw makeUnknownBuiltinError(canonical + rootSuffix);
      }
      return {cacheKey: canonical, modulePath: canonical};
    }
    if (rootPath.startsWith('data:')) {
      const canonical = new URL(rootPath).href;
      return {cacheKey: canonical, modulePath: canonical};
    }
    return {cacheKey: fileCacheKey(rootPath, rootSuffix), modulePath: rootPath};
  }

  private isReEnteringActiveWalk(
    rootKey: string,
    registry: Map<string, JestModule>,
  ): boolean {
    return this.activeSyncWalks.some(
      walk => walk.registry === registry && walk.keys.has(rootKey),
    );
  }

  // An ancestor walk's root maps to a module Node would report as
  // `'evaluating'` when a mid-walk require()'s graph reaches back to it -
  // Node throws ERR_REQUIRE_CYCLE_MODULE there. The current walk (the last
  // stack entry) is excluded: a dep matching its own root is a static ESM
  // cycle, which is legal.
  private isAncestorWalkRoot(
    cacheKey: string,
    registry: ModuleRegistry | Map<string, JestModule>,
  ): boolean {
    return this.activeSyncWalks
      .slice(0, -1)
      .some(walk => walk.registry === registry && walk.rootKey === cacheKey);
  }

  // A require() fired from a CJS body executing mid-walk can run a nested
  // walk that builds and commits modules this walk has also scratched but
  // not committed (scratch entries are invisible to the nested walk).
  // Adopt the committed instances: linking and evaluating our own copies
  // would evaluate those modules a second time and leave this graph holding
  // different instances than the registry serves everyone else. A dynamic
  // import() cannot race the walk the same way - the walk never awaits, so
  // an import()'s continuation only runs after the walk has settled and
  // committed, where it finds the finished entries.
  private adoptCommittedScratchEntries(
    scratch: Map<string, ScratchEntry>,
    registry: Map<string, JestModule>,
  ): void {
    for (const [cacheKey, entry] of scratch) {
      const committed = registry.get(cacheKey);
      if (!committed || committed instanceof Promise) continue;
      // Prelinked entries adopted from the registry (or committed eagerly,
      // like @jest/globals synthetics) already hold the registry's module.
      if (committed === entry.module) continue;
      if (committed.status === 'errored') throw committed.error;
      if (committed.status === 'evaluated' || committed.status === 'linked') {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'prelinked',
          module: committed,
        });
      }
    }
  }

  private walkGraphSync({
    rootKey,
    activeWalk,
    worklist,
    scratch,
    registry,
    context,
    mode,
  }: {
    rootKey: string;
    activeWalk: Set<string>;
    worklist: Array<WorklistEntry>;
    scratch: Map<string, ScratchEntry>;
    registry: Map<string, JestModule>;
    context: VMContext;
    mode: SyncEsmMode;
  }): ESModule | LoadAsync {
    while (worklist.length > 0) {
      const {cacheKey, modulePath} = worklist.pop()!;
      activeWalk.add(cacheKey);
      if (scratch.has(cacheKey)) continue;

      // Registry first, mutex second. `'unlinked'` / `'linking'` /
      // `'evaluating'` mean the legacy path is mid-flight on this dep;
      // plugging an unlinked module into the parent's `linkRequests` would
      // fail Node's link cascade, so bail. `'linked'` is adoptable: it is
      // already instantiated, so the root's evaluate cascade runs its body.
      const fromRegistry = registry.get(cacheKey);
      if (fromRegistry instanceof Promise) return LOAD_ASYNC;
      if (fromRegistry) {
        if (fromRegistry.status === 'errored') throw fromRegistry.error;
        if (
          fromRegistry.status !== 'evaluated' &&
          fromRegistry.status !== 'linked'
        ) {
          return LOAD_ASYNC;
        }
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'prelinked',
          module: fromRegistry,
        });
        continue;
      }
      if (this.transformCache.hasMutex(cacheKey)) return LOAD_ASYNC;

      if (this.resolution.isCoreModule(modulePath)) {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'prelinked',
          module: buildCoreSyntheticModule(modulePath, context, name =>
            this.coreModule.require(name),
          ),
        });
        continue;
      }

      if (modulePath.startsWith('data:')) {
        const built = this.buildSyncDataUriEntry(
          modulePath,
          cacheKey,
          context,
          scratch,
          registry,
          worklist,
          mode,
        );
        if (built === LOAD_ASYNC) return LOAD_ASYNC;
        scratch.set(cacheKey, built);
        continue;
      }

      if (isWasm(modulePath)) {
        const wasmEntry = this.buildSyncWasmEntry(
          this.fileCache.readFileBuffer(modulePath),
          modulePath,
          cacheKey,
          context,
          scratch,
          registry,
          worklist,
          mode,
        );
        if (wasmEntry === LOAD_ASYNC) return LOAD_ASYNC;
        scratch.set(cacheKey, wasmEntry);
        continue;
      }

      if (!this.transformCache.canTransformSync(modulePath)) {
        if (mode === 'sync-required') {
          throw makeRequireAsyncError(
            modulePath,
            'a configured transformer is async-only',
          );
        }
        return LOAD_ASYNC;
      }

      if (modulePath.endsWith('.json')) {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'prelinked',
          module: buildJsonSyntheticModule(
            this.transformCache.transform(modulePath, ESM_TRANSFORM_OPTIONS),
            modulePath,
            context,
          ),
        });
        continue;
      }

      const transformedCode = this.transformCache.transform(
        modulePath,
        ESM_TRANSFORM_OPTIONS,
      );

      const entry = this.buildSyncSourceEntry({
        cacheKey,
        code: transformedCode,
        context,
        identifier: modulePath,
        initializeImportMeta: meta => {
          const metaUrl = cacheKey;
          meta.url = metaUrl;
          // @ts-expect-error Jest uses @types/node@18.
          meta.filename = modulePath;
          // @ts-expect-error Jest uses @types/node@18.
          meta.dirname = path.dirname(modulePath);
          meta.resolve = (specifier, parent: string | URL = metaUrl) => {
            const parentPath = fileURLToPath(parent);
            return this.resolveForImportMeta(parentPath, specifier);
          };
          // @ts-expect-error Jest uses @types/node@18.
          meta.main = modulePath === this.testPath;
          (meta as JestImportMeta).jest =
            this.jestGlobals.jestObjectFor(modulePath);
        },
        mode,
        registry,
        scratch,
        worklist,
      });
      if (entry === LOAD_ASYNC) return LOAD_ASYNC;

      scratch.set(cacheKey, entry);
    }

    this.adoptCommittedScratchEntries(scratch, registry);

    for (const entry of scratch.values()) {
      if (entry.kind !== 'source') continue;
      const depModules = entry.deps.map(depKey => {
        const depEntry = scratch.get(depKey);
        invariant(
          depEntry,
          `Sync ESM graph missing dep ${depKey} for ${entry.cacheKey}. This is a bug in Jest, please report it!`,
        );
        return depEntry.module;
      });
      invariant(
        typeof entry.module.linkRequests === 'function',
        `linkRequests unavailable on ${entry.cacheKey}`,
      );
      entry.module.linkRequests(depModules);
    }

    const rootEntry = scratch.get(rootKey);
    invariant(rootEntry, 'Sync ESM graph missing root entry');
    const rootModule = rootEntry.module;

    if (rootEntry.kind === 'source') {
      invariant(
        typeof rootModule.instantiate === 'function',
        'instantiate unavailable on root',
      );
      rootModule.instantiate();

      if (moduleHasAsyncGraph(rootModule)) {
        if (mode === 'sync-required') {
          let culprit = rootModule.identifier;
          for (const entry of scratch.values()) {
            if (
              entry.kind === 'source' &&
              typeof entry.module.hasTopLevelAwait === 'function' &&
              entry.module.hasTopLevelAwait()
            ) {
              culprit = entry.module.identifier;
              break;
            }
          }
          throw makeRequireAsyncError(
            rootModule.identifier,
            culprit === rootModule.identifier
              ? 'top-level await'
              : `a dependency uses top-level await (${culprit})`,
          );
        }
        return LOAD_ASYNC;
      }
    }

    for (const entry of scratch.values()) {
      if (!registry.has(entry.cacheKey)) {
        registry.set(entry.cacheKey, entry.module);
      }
    }

    rootModule.evaluate().catch(noop);

    if (rootModule.status === 'errored') {
      throw rootModule.error;
    }
    invariant(
      rootModule.status === 'evaluated',
      `Expected synchronous evaluation to complete for ${rootModule.identifier}, but module status is "${rootModule.status}". This is a bug in Jest, please report it!`,
    );

    return rootModule;
  }

  // A module sits in the registry linked-but-unevaluated when an earlier walk
  // linked it and then failed before the evaluate cascade reached it - a
  // sibling threw, or the walk bailed on an unsupported edge. It is fully
  // instantiated, so evaluating it now is all that is left.
  private evaluateLinkedModule(
    module: VMModuleWithAsyncGraph,
    mode: SyncEsmMode,
  ): ESModule | LoadAsync {
    if (moduleHasAsyncGraph(module)) {
      if (mode === 'sync-required') {
        throw makeRequireAsyncError(module.identifier, 'top-level await');
      }
      return LOAD_ASYNC;
    }

    // Deliberately not recorded in `evaluatingMap`, unlike the legacy path.
    // The async-graph check above means this only ever evaluates a graph that
    // finishes before `evaluate()` returns, so there is no pending promise for
    // another caller to await - and the legacy path only populates that map in
    // its own async branch. Neither path awaits between reading `status` and
    // calling `evaluate()`, so a duplicate evaluation cannot start in between.
    module.evaluate().catch(noop);

    if (module.status === 'errored') {
      throw module.error;
    }
    invariant(
      module.status === 'evaluated',
      `Expected synchronous evaluation to complete for ${module.identifier}, but module status is "${module.status}". This is a bug in Jest, please report it!`,
    );
    return module;
  }

  private getContext(): VMContext {
    invariant(
      typeof this.environment.getVmContext === 'function',
      'ES Modules are only supported if your test environment has the `getVmContext` function',
    );
    const context = this.environment.getVmContext();
    invariant(context, 'Test environment has been torn down');
    return context;
  }

  // Commits (or reuses) a synthetic-module entry under `cacheKey` in both the
  // local scratch and the long-lived registry. Returns `false` when the
  // registry holds something the caller must bail on: a mid-flight Promise
  // from the legacy async path, or a module still being linked (legacy can
  // stash an `'unlinked'` SourceTextModule here while link/evaluate runs).
  private tryCommitSynthetic(
    cacheKey: string,
    registry: ModuleRegistry | Map<string, JestModule>,
    scratch: Map<string, ScratchEntry>,
    build: () => VMModuleWithAsyncGraph,
  ): boolean {
    if (scratch.has(cacheKey)) return true;
    const fromRegistry = registry.get(cacheKey);
    if (fromRegistry instanceof Promise) return false;
    if (fromRegistry) {
      const cached = fromRegistry as VMModule;
      if (cached.status === 'errored') throw cached.error;
      if (cached.status !== 'evaluated' && cached.status !== 'linked') {
        return false;
      }
    }
    const module =
      (fromRegistry as VMModuleWithAsyncGraph | undefined) ?? build();
    if (!fromRegistry) registry.set(cacheKey, module);
    scratch.set(cacheKey, {cacheKey, kind: 'prelinked', module});
    return true;
  }

  // Node answers `import.meta.resolve('fs')` with `'node:fs'`, not a file URL -
  // a builtin has no path to turn into one.
  private resolveForImportMeta(parentPath: string, specifier: string): string {
    // Node echoes `node:` specifiers verbatim - even with a query or fragment,
    // which only fail later, at load time.
    if (specifier.startsWith('node:')) {
      return specifier;
    }
    const {pathOrSpecifier, suffix} = splitQueryAndFragment(specifier);
    const resolved = this.resolution.resolveEsm(parentPath, pathOrSpecifier);
    if (this.resolution.isCoreModule(resolved)) {
      if (suffix !== '') {
        throw makeUnknownBuiltinError(specifier);
      }
      return canonicalCoreSpecifier(resolved);
    }
    return fileCacheKey(resolved, suffix);
  }

  private resolveSpecifierForSyncGraph(
    referencingIdentifier: string,
    specifier: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    mode: SyncEsmMode,
  ): ResolvedSyncSpecifier | LoadAsync {
    if (specifier === '@jest/globals') {
      const cacheKey = `@jest/globals/${referencingIdentifier}`;
      const ok = this.tryCommitSynthetic(cacheKey, registry, scratch, () =>
        this.jestGlobals.esmGlobalsModule(referencingIdentifier, context),
      );
      return ok ? {cacheKey, enqueue: null, modulePath: cacheKey} : LOAD_ASYNC;
    }

    if (specifier.startsWith('data:')) {
      const cacheKey = new URL(specifier).href;
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: cacheKey},
        modulePath: cacheKey,
      };
    }

    const {pathOrSpecifier: specifierPath, suffix} =
      splitQueryAndFragment(specifier);

    const {shouldMock, moduleID} = this.mockState.shouldMockEsmSync(
      referencingIdentifier,
      specifierPath,
    );
    if (shouldMock) {
      const mocked = this.importMockSync(
        specifierPath,
        moduleID,
        context,
        scratch,
        mode,
      );
      if (mocked === LOAD_ASYNC) return LOAD_ASYNC;
      return {
        cacheKey: mocked.cacheKey,
        enqueue: null,
        modulePath: specifierPath,
      };
    }

    if (this.resolution.isCoreModule(specifierPath)) {
      if (suffix !== '') {
        throw makeUnknownBuiltinError(
          canonicalCoreSpecifier(specifierPath) + suffix,
        );
      }
      // `fs` and `node:fs` are one module to Node, so they have to share one
      // registry entry - otherwise each form gets its own synthetic wrapper and
      // `import * as a from 'fs'` !== `import * as b from 'node:fs'`.
      const cacheKey = canonicalCoreSpecifier(specifierPath);
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: cacheKey},
        modulePath: cacheKey,
      };
    }

    let resolved: string;
    try {
      resolved = this.resolution.resolveEsm(
        referencingIdentifier,
        specifierPath,
      );
    } catch (error) {
      if (mode === 'sync-required') throw error;
      return LOAD_ASYNC;
    }

    const cacheKey = fileCacheKey(resolved, suffix);
    if (
      mode === 'sync-required' &&
      this.isAncestorWalkRoot(cacheKey, registry)
    ) {
      throw makeRequireCycleError(resolved, referencingIdentifier);
    }
    if (
      !resolved.endsWith('.json') &&
      !isWasm(resolved) &&
      !this.shouldLoadAsEsm(resolved)
    ) {
      try {
        const ok = this.tryCommitSynthetic(cacheKey, registry, scratch, () =>
          this.buildCjsAsEsmSyntheticModule(
            referencingIdentifier,
            resolved,
            context,
          ),
        );
        return ok
          ? {cacheKey, enqueue: null, modulePath: resolved}
          : LOAD_ASYNC;
      } catch (error) {
        if (!(error instanceof CjsParseError)) throw error;
        if (this.resolution.isExplicitlyCommonjs(resolved)) throw error.cause;
        // File has ESM syntax but no ESM marker — fall through to the enqueue path.
      }
    }

    return {
      cacheKey,
      enqueue: {cacheKey, modulePath: resolved},
      modulePath: resolved,
    };
  }

  private importMockSync(
    moduleName: string,
    moduleID: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    mode: SyncEsmMode,
  ): {cacheKey: string} | LoadAsync {
    const existing = this.registries.getModuleMock(moduleID);
    if (existing instanceof Promise) return LOAD_ASYNC;
    if (existing) {
      if (existing.status === 'errored') throw existing.error;

      if (!scratch.has(moduleID)) {
        scratch.set(moduleID, {
          cacheKey: moduleID,
          kind: 'prelinked',
          module: existing,
        });
      }
      return {cacheKey: moduleID};
    }

    const factory = this.mockState.getEsmFactory(moduleID);
    // `shouldMockEsmSync` said this spec is mocked but no factory was
    // registered.
    invariant(
      factory !== undefined,
      'Attempting to import a mock without a factory',
    );

    const result = factory();
    if (isPromise(result)) {
      if (mode === 'sync-required') {
        throw makeRequireAsyncError(moduleName, 'mock factory is async');
      }
      return LOAD_ASYNC;
    }

    const synth = syntheticFromExports(
      moduleName,
      context,
      result as Record<string, unknown>,
    );
    this.registries.setModuleMock(moduleID, synth);
    scratch.set(moduleID, {
      cacheKey: moduleID,
      kind: 'prelinked',
      module: synth,
    });
    return {cacheKey: moduleID};
  }

  // Construct a wasm SyntheticModule for the sync graph. Wasm imports are
  // resolved (sync) and enqueued like static-import deps. The SyntheticModule's
  // body closure-captures `scratch`; by evaluate-cascade time, every dep entry
  // is fully evaluated so `module.namespace` is safe to read.
  //
  // Uses `new WebAssembly.Module(bytes)` (sync, blocks on large modules).
  private buildSyncWasmEntry(
    bytes: BufferSource,
    identifier: string,
    cacheKey: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    worklist: Array<WorklistEntry>,
    mode: SyncEsmMode,
  ): ScratchEntry | LoadAsync {
    const wasmModule = new WebAssembly.Module(bytes);

    const moduleSpecToCacheKey = new Map<string, string>();
    for (const {module: depSpec} of WebAssembly.Module.imports(wasmModule)) {
      if (moduleSpecToCacheKey.has(depSpec)) continue;
      const resolved = this.resolveSpecifierForSyncGraph(
        identifier,
        depSpec,
        context,
        scratch,
        registry,
        mode,
      );
      if (resolved === LOAD_ASYNC) return LOAD_ASYNC;
      moduleSpecToCacheKey.set(depSpec, resolved.cacheKey);
      if (resolved.enqueue) worklist.push(resolved.enqueue);
    }

    const synthetic = buildWasmSyntheticModule(
      wasmModule,
      identifier,
      context,
      depSpec => {
        const depKey = moduleSpecToCacheKey.get(depSpec)!;
        const depEntry = scratch.get(depKey)!;
        return depEntry.module.namespace as Record<string, unknown>;
      },
    );

    return {
      cacheKey,
      kind: 'prelinked',
      module: synthetic,
    };
  }

  // `import.meta.resolve` inside a data: module. A data: base URL is not
  // hierarchical, so Node resolves only built-in modules and specifiers that
  // are themselves absolute URLs - relative and bare specifiers both throw.
  private dataUriMetaResolve(specifier: string): (request: string) => string {
    return request => {
      if (this.resolution.isCoreModule(request)) {
        return canonicalCoreSpecifier(request);
      }
      if (urlSchemeRegex.test(request)) {
        return new URL(request).href;
      }
      const error: NodeJS.ErrnoException = new TypeError(
        `Failed to resolve module specifier "${request}" from "${specifier}": Invalid relative URL or base scheme is not hierarchical.`,
      );
      error.code = 'ERR_UNSUPPORTED_RESOLVE_REQUEST';
      throw error;
    };
  }

  private buildSyncDataUriEntry(
    specifier: string,
    cacheKey: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    worklist: Array<WorklistEntry>,
    mode: SyncEsmMode,
  ): ScratchEntry | LoadAsync {
    const {mime, code} = parseDataUri(specifier);

    if (mime === 'application/wasm') {
      return this.buildSyncWasmEntry(
        new Uint8Array(code as Buffer),
        specifier,
        cacheKey,
        context,
        scratch,
        registry,
        worklist,
        mode,
      );
    }

    if (mime === 'application/json') {
      return {
        cacheKey,
        kind: 'prelinked',
        module: buildJsonSyntheticModule(code as string, specifier, context),
      };
    }

    return this.buildSyncSourceEntry({
      cacheKey,
      code: code as string,
      context,
      identifier: specifier,
      initializeImportMeta: meta => {
        meta.url = specifier;
        // @ts-expect-error Jest uses @types/node@18.
        meta.main = false;
        meta.resolve = this.dataUriMetaResolve(specifier);
        (meta as JestImportMeta).jest =
          this.jestGlobals.jestObjectFor(specifier);
      },
      mode,
      registry,
      scratch,
      worklist,
    });
  }

  // The source-module half of a sync walk: construct, refuse top-level await,
  // then resolve each static import so the caller can link the graph. Callers
  // differ only in what `import.meta` gets.
  private buildSyncSourceEntry({
    cacheKey,
    code,
    context,
    identifier,
    initializeImportMeta,
    mode,
    registry,
    scratch,
    worklist,
  }: {
    cacheKey: string;
    code: string;
    context: VMContext;
    identifier: string;
    initializeImportMeta: (meta: ImportMeta) => void;
    mode: SyncEsmMode;
    registry: ModuleRegistry | Map<string, JestModule>;
    scratch: Map<string, ScratchEntry>;
    worklist: Array<WorklistEntry>;
  }): ScratchEntry | LoadAsync {
    const module = new SourceTextModule(code, {
      context,
      identifier,
      importModuleDynamically: this.dynamicImport,
      initializeImportMeta,
    }) as VMModuleWithAsyncGraph;

    if (
      typeof module.hasTopLevelAwait === 'function' &&
      module.hasTopLevelAwait()
    ) {
      if (mode === 'sync-required') {
        throw makeRequireAsyncError(identifier, 'top-level await');
      }
      return LOAD_ASYNC;
    }

    // If we got here without `moduleRequests`, the capability gate is lying.
    invariant(
      module.moduleRequests !== undefined,
      `moduleRequests unavailable on ${identifier}`,
    );
    const deps: Array<string> = [];
    for (const {specifier, attributes} of module.moduleRequests) {
      const resolved = this.resolveSpecifierForSyncGraph(
        identifier,
        specifier,
        context,
        scratch,
        registry,
        mode,
      );
      if (resolved === LOAD_ASYNC) return LOAD_ASYNC;
      validateImportAttributes(resolved.modulePath, attributes, identifier);
      deps.push(resolved.cacheKey);
      if (resolved.enqueue) worklist.push(resolved.enqueue);
    }

    return {cacheKey, deps, kind: 'source', module};
  }

  // Synthetic-module wrappers that close over the primitive deps. The
  // `requireModuleOrMock` callback inside `buildCjsAsEsmSyntheticModule`
  // is the extension-point bridge to `Runtime.requireModuleOrMock`.
  private buildCjsAsEsmSyntheticModule(
    from: string,
    modulePath: string,
    context: VMContext,
  ): SyntheticModule {
    return buildCjsAsEsmSyntheticModule(
      from,
      modulePath,
      context,
      this.requireModuleOrMock,
      this.cjsExportsCache,
    );
  }

  // TODO: legacy async path - everything below is deletable when min-Node
  // ≥ v24.9 (the sync core handles all entry shapes). Drop the `linkingMap`
  // / `evaluatingMap` fields with it.

  // Called from CJS bodies via `compileFunction`'s `importModuleDynamically`.
  dynamicImportFromCjs(
    specifier: string,
    identifier: string,
    context: VMContext,
    importAttributes?: ImportAttributes,
  ): Promise<VMModule> {
    return this.resolveModule<VMModule>(specifier, identifier, context).then(
      m => {
        validateImportAttributes(
          m.identifier,
          importAttributes ?? {},
          identifier,
        );
        return this.linkAndEvaluateModule(m);
      },
    );
  }

  // Public entry for `Runtime.unstable_importModule`. Runtime keeps the
  // public method as the override seam; this is the body.
  async loadAndEvaluate(from: string, moduleName?: string): Promise<unknown> {
    invariant(
      runtimeSupportsVmModules,
      'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
    );
    const {pathOrSpecifier, suffix} = splitQueryAndFragment(moduleName ?? '');
    const modulePath = await this.resolution.resolveEsmAsync(
      from,
      pathOrSpecifier,
    );
    const module = await this.loadEsmModule(modulePath, suffix);
    return this.linkAndEvaluateModule(module);
  }

  private async loadEsmModule(
    modulePath: string,
    suffix = '',
  ): Promise<ESModule> {
    // Two gates here. `supportsSyncEvaluate` is a Node-version check: the
    // sync core relies on `SyntheticModule` starting `'linked'` and on
    // `evaluate()` completing sync, both of which need v22.21+ / v24.8+.
    // `canResolveSync` is a configured-resolver check: with an async-only
    // user resolver `findNodeModule` silently falls back to the default
    // resolver and would silently miss user mappings.
    if (supportsSyncEvaluate && this.resolution.canResolveSync()) {
      const synced = this.tryLoadGraphSync(
        modulePath,
        suffix,
        'sync-preferred',
      );
      if (synced !== LOAD_ASYNC) return synced;
    }

    const {cacheKey} = this.canonicalizeRoot(modulePath, suffix);
    const registry = this.registries.getActiveEsmRegistry();

    if (this.transformCache.hasMutex(cacheKey)) {
      await this.transformCache.awaitMutex(cacheKey);
    }

    if (!registry.has(cacheKey)) {
      const context = this.getContext();

      let transformResolve: () => void;
      let transformReject: (error?: unknown) => void;

      const mutex = new Promise<void>((resolve, reject) => {
        transformResolve = resolve;
        transformReject = reject;
      });
      // Prevent an unhandled-rejection warning when no concurrent caller is
      // awaiting the mutex — the originating caller re-throws the error itself.
      // Concurrent waiters still see the rejection because they await `mutex`.
      mutex.catch(noop);
      this.transformCache.setMutex(cacheKey, mutex);

      invariant(
        transformResolve! && transformReject!,
        'Promise initialization should be sync - please report this bug to Jest!',
      );

      try {
        if (isWasm(modulePath)) {
          const wasm = this.importWasmModule(
            this.fileCache.readFileBuffer(modulePath),
            modulePath,
            context,
          );
          registry.set(cacheKey, wasm);
          transformResolve();
          return wasm;
        }

        if (this.resolution.isCoreModule(modulePath)) {
          const core = evaluateSyntheticModule(
            buildCoreSyntheticModule(modulePath, context, name =>
              this.coreModule.require(name),
            ),
          );
          registry.set(cacheKey, core);
          transformResolve();
          return core;
        }

        const transformedCode = this.transformCache.canTransformSync(modulePath)
          ? this.transformCache.transform(modulePath, ESM_TRANSFORM_OPTIONS)
          : await this.transformCache.transformAsync(
              modulePath,
              ESM_TRANSFORM_OPTIONS,
            );

        let module: VMModule;
        if (modulePath.endsWith('.json')) {
          module = buildJsonSyntheticModule(
            transformedCode,
            modulePath,
            context,
          );
        } else {
          module = new SourceTextModule(transformedCode, {
            context,
            identifier: modulePath,
            importModuleDynamically: this.dynamicImport,
            initializeImportMeta: meta => {
              const metaUrl = cacheKey;
              meta.url = metaUrl;
              // @ts-expect-error Jest uses @types/node@18.
              meta.filename = modulePath;
              // @ts-expect-error Jest uses @types/node@18.
              meta.dirname = path.dirname(modulePath);
              meta.resolve = (specifier, parent: string | URL = metaUrl) => {
                const parentPath = fileURLToPath(parent);
                return this.resolveForImportMeta(parentPath, specifier);
              };
              // @ts-expect-error Jest uses @types/node@18.
              meta.main = modulePath === this.testPath;
              (meta as JestImportMeta).jest =
                this.jestGlobals.jestObjectFor(modulePath);
            },
          });
        }

        invariant(
          !registry.has(cacheKey),
          `Module cache already has entry ${cacheKey}. This is a bug in Jest, please report it!`,
        );
        registry.set(cacheKey, module);
        transformResolve();
      } catch (error) {
        transformReject(error);
        throw error;
      } finally {
        this.transformCache.clearMutex(cacheKey);
      }
    }

    const module = registry.get(cacheKey);
    invariant(
      module,
      'Module cache does not contain module. This is a bug in Jest, please open up an issue',
    );
    return module as ESModule;
  }

  private async resolveModule<T = unknown>(
    specifier: string,
    referencingIdentifier: string,
    context: VMContext,
  ): Promise<T> {
    if (
      this.testState.bailIfTornDown(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      )
    ) {
      // @ts-expect-error -- exiting
      return;
    }

    const registry = this.registries.getActiveEsmRegistry();

    if (specifier === '@jest/globals') {
      const globalsIdentifier = `@jest/globals/${referencingIdentifier}`;
      const fromCache = registry.get(globalsIdentifier);
      if (fromCache) {
        return fromCache as T;
      }
      const globals = evaluateSyntheticModule(
        this.jestGlobals.esmGlobalsModule(referencingIdentifier, context),
      );
      registry.set(globalsIdentifier, globals);
      return globals as T;
    }

    if (specifier.startsWith('data:')) {
      const dataDecision = await this.mockState.shouldMockEsmAsync(
        referencingIdentifier,
        specifier,
      );
      if (dataDecision.shouldMock) {
        return this.importMock(specifier, dataDecision.moduleID, context);
      }
      // The canonical serialization (whitespace stripped, non-ASCII
      // percent-encoded) is the module's URL: spelling variants of one URL
      // share an instance, exactly as in Node.
      specifier = new URL(specifier).href;
      const fromCache = registry.get(specifier);
      if (fromCache) {
        return fromCache as T;
      }
      const {mime, code} = parseDataUri(specifier);
      let module: VMModule;
      if (mime === 'application/wasm') {
        module = await this.importWasmModule(
          new Uint8Array(code as Buffer),
          specifier,
          context,
        );
      } else if (mime === 'application/json') {
        module = buildJsonSyntheticModule(code as string, specifier, context);
      } else {
        module = new SourceTextModule(code as string, {
          context,
          identifier: specifier,
          importModuleDynamically: this.dynamicImport,
          initializeImportMeta: meta => {
            meta.url = specifier;
            // @ts-expect-error Jest uses @types/node@18.
            meta.main = false;
            meta.resolve = this.dataUriMetaResolve(specifier);
            (meta as JestImportMeta).jest =
              this.jestGlobals.jestObjectFor(specifier);
          },
        });
      }
      registry.set(specifier, module);
      return module as T;
    }

    const {pathOrSpecifier: specifierPath, suffix} =
      splitQueryAndFragment(specifier);

    const decision = await this.mockState.shouldMockEsmAsync(
      referencingIdentifier,
      specifierPath,
    );
    if (decision.shouldMock) {
      return this.importMock(specifierPath, decision.moduleID, context);
    }

    const resolved = await this.resolution.resolveEsmAsync(
      referencingIdentifier,
      specifierPath,
    );

    if (
      resolved.endsWith('.json') ||
      this.resolution.isCoreModule(resolved) ||
      this.shouldLoadAsEsm(resolved)
    ) {
      return this.loadEsmModule(resolved, suffix) as T;
    }

    return this.loadCjsAsEsm(
      referencingIdentifier,
      resolved,
      suffix,
      context,
    ) as T;
  }

  private async linkAndEvaluateModule(module: VMModule): Promise<VMModule> {
    if (
      this.testState.bailIfTornDown(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      )
    ) {
      // @ts-expect-error: exiting early
      return;
    }

    // Already-errored module from a prior failed evaluation.
    if (module.status === 'errored') {
      throw module.error;
    }

    if (module.status === 'unlinked') {
      this.linkingMap.set(
        module,
        module.link(async (specifier, referencingModule, extra) => {
          const resolved = await this.resolveModule<VMModule>(
            specifier,
            referencingModule.identifier,
            referencingModule.context,
          );
          const extraAttrs = extra as ModuleLinkExtra | undefined;
          validateImportAttributes(
            resolved.identifier,
            extraAttrs?.attributes ?? extraAttrs?.assert ?? {},
            referencingModule.identifier,
          );
          return resolved;
        }),
      );
    }

    const linkPromise = this.linkingMap.get(module);
    if (linkPromise != null) {
      await linkPromise;
    } else if (module.status === 'linking') {
      // Module entered 'linking' via Node's cascade (a parent's link()
      // recursed into this dep without going through our code). We have no
      // promise to await, so yield via setImmediate - which lets all pending
      // microtasks (including Node's internal linker chain) drain - until
      // linking finishes.
      const deadline = Date.now() + 5000;
      while (module.status === 'linking') {
        if (Date.now() > deadline) {
          throw new Error(
            `Jest: module ${module.identifier} is stuck in 'linking' state after 5 s - ` +
              'this is likely a bug in Jest (please report it).',
          );
        }
        await new Promise<void>(resolve => setImmediate(resolve));
      }
    }

    if (module.status === 'linked') {
      if (supportsSyncEvaluate && !moduleHasAsyncGraph(module)) {
        // `evaluate()` fulfills synchronously when the graph has no top-level
        // await, so we don't need to yield. Errors land on `module.status`,
        // not as a Promise rejection. Gated on `supportsSyncEvaluate` because
        // pre-v22.21 / pre-v24.8 Node returns a genuinely-async Promise here
        // and the status invariant below would fire on `'evaluating'`.
        void module.evaluate().catch(noop);
        const status = module.status as VMModule['status'];
        if (status === 'errored') {
          throw module.error;
        }
        invariant(
          status === 'evaluated',
          `Expected synchronous evaluation to complete for ${module.identifier}, but module status is "${status}". This is a bug in Jest, please report it!`,
        );
      } else {
        // Async path: TLA somewhere in the graph, or Node lacks the v22.21+ /
        // v24.8+ sync-evaluate semantics. Store the promise so concurrent
        // callers finding the module in `'evaluating'` await the same one.
        this.evaluatingMap.set(module, module.evaluate());
      }
    }

    await this.evaluatingMap.get(module);

    // A concurrent caller may have driven the evaluation while we awaited the
    // link or evaluate promise, and it throws on its own stack - so re-read
    // the status rather than assuming we are the one that evaluated.
    if ((module.status as VMModule['status']) === 'errored') {
      throw module.error;
    }

    return module;
  }

  private loadCjsAsEsm(
    from: string,
    modulePath: string,
    suffix: string,
    context: VMContext,
  ): SyntheticModule | Promise<VMModule> {
    const registry = this.registries.getActiveEsmRegistry();
    const cacheKey = fileCacheKey(modulePath, suffix);
    const cached = registry.get(cacheKey);
    if (cached) {
      return cached as SyntheticModule | Promise<VMModule>;
    }

    let synthetic: SyntheticModule;
    try {
      synthetic = this.buildCjsAsEsmSyntheticModule(from, modulePath, context);
    } catch (error) {
      if (!(error instanceof CjsParseError)) throw error;
      if (this.resolution.isExplicitlyCommonjs(modulePath)) throw error.cause;
      return this.loadEsmModule(modulePath, suffix);
    }

    const evaluated = evaluateSyntheticModule(synthetic);
    registry.set(cacheKey, evaluated);
    return evaluated;
  }

  private async importMock<T = unknown>(
    moduleName: string,
    moduleID: string,
    context: VMContext,
  ): Promise<T> {
    if (this.registries.hasModuleMock(moduleID)) {
      return this.registries.getModuleMock(moduleID) as T;
    }

    const factory = this.mockState.getEsmFactory(moduleID);
    if (factory) {
      const invokedFactory = (await factory()) as Record<string, unknown>;
      const module = syntheticFromExports(moduleName, context, invokedFactory);
      this.registries.setModuleMock(moduleID, module);
      return evaluateSyntheticModule(module) as T;
    }

    throw new Error('Attempting to import a mock without a factory');
  }

  private async importWasmModule(
    source: BufferSource,
    identifier: string,
    context: VMContext,
  ): Promise<SyntheticModule> {
    // Use async `WebAssembly.compile` (rather than the sync constructor used
    // by the v24.9+ sync core) to avoid blocking the event loop on large wasm
    // modules in the legacy async path.
    const wasmModule = await WebAssembly.compile(source);
    const moduleLookup: Record<string, VMModule> = {};
    for (const {module} of WebAssembly.Module.imports(wasmModule)) {
      if (moduleLookup[module] === undefined) {
        const resolvedModule = await this.resolveModule<VMModule>(
          module,
          identifier,
          context,
        );
        // Do NOT call linkAndEvaluateModule here: we are executing inside the
        // linker callback for the parent module, so Node's cascade may already
        // be linking resolvedModule. Calling linkAndEvaluateModule would
        // spin-wait via setImmediate, but the cascade can't finish until this
        // linker returns - deadlock. The SyntheticModule's body runs only
        // after Node has fully evaluated all deps in topological order.
        moduleLookup[module] = resolvedModule;
      }
    }
    return buildWasmSyntheticModule(
      wasmModule,
      identifier,
      context,
      depSpec => moduleLookup[depSpec].namespace as Record<string, unknown>,
    );
  }

  // Shared async dynamic-import callback installed on every SourceTextModule
  // we construct. Goes through the legacy async path; revisit when min-Node
  // reaches v24.9 (Node may handle dynamic imports for us by then).
  private dynamicImport = async (
    specifier: string,
    referencingModule: VMModule,
    importAttributes?: ImportAttributes,
  ): Promise<VMModule> => {
    invariant(
      runtimeSupportsVmModules,
      'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
    );
    this.testState.throwIfBetweenTests(
      'You are trying to `import` a file outside of the scope of the test code.',
    );
    this.testState.throwIfTornDown(
      'You are trying to `import` a file after the Jest environment has been torn down.',
    );
    const dyn = await this.resolveModule<VMModule>(
      specifier,
      referencingModule.identifier,
      referencingModule.context,
    );
    validateImportAttributes(
      dyn.identifier,
      importAttributes ?? {},
      referencingModule.identifier,
    );
    return this.linkAndEvaluateModule(dyn);
  };
}
