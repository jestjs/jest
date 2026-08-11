/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  AnyMap,
  type TraceMap,
  originalPositionFor,
} from '@jridgewell/trace-mapping';
import {existsSync, readFileSync} from 'graceful-fs';
import type {SourceMapRegistry} from './types';

export interface GeneratedPosition {
  column: number | null;
  line: number | null;
  source: string;
}

export interface MappedPosition extends GeneratedPosition {
  name?: string | null;
}

interface LoadedSourceMap {
  map: TraceMap;
  url: string;
}

// Keep executing the search to find the *last* sourceMappingURL, to avoid
// picking up ones from comments, strings, etc.
const SOURCE_MAPPING_URL_REGEXP =
  /(?:\/\/[#@]\s*sourceMappingURL=([^\s'"]+)\s*$)|(?:\/\*[#@]\s*sourceMappingURL=([^\s*'"]+)\s*\*\/\s*$)/gm;
const INLINE_SOURCE_MAP_REGEXP = /^data:application\/json[^,]+base64,/;

function toFilePath(source: string): string {
  const trimmed = source.trim();

  if (!trimmed.startsWith('file:')) {
    return trimmed;
  }

  try {
    return fileURLToPath(trimmed);
  } catch {
    return trimmed;
  }
}

function readFile(source: string): string | null {
  const filePath = toFilePath(source);

  try {
    return existsSync(filePath) ? readFileSync(filePath, 'utf8') : null;
  } catch {
    return null;
  }
}

// A scheme needs at least two characters before the colon, so a Windows drive
// letter is not mistaken for one.
const ABSOLUTE_URI_REGEXP = /^[a-zA-Z][\w+\-.]+:/;

// Resolve a URL relative to a directory, keeping any protocol prefix intact.
function resolveRelativeTo(from: string, url: string): string {
  // Bundlers name their sources with a scheme — `webpack:///src/a.ts`. Resolving
  // one against a directory invents a path that has never existed.
  if (ABSOLUTE_URI_REGEXP.test(url)) {
    return url;
  }

  const dir = path.dirname(from);
  const protocol = /^\w+:\/\/[^/]*/.exec(dir)?.[0] ?? '';
  const startPath = dir.slice(protocol.length);

  if (protocol && /^\/\w:/.test(startPath)) {
    // file:///C:/dir/file
    return `${protocol}/${path
      .resolve(startPath.slice(1), url)
      .replaceAll('\\', '/')}`;
  }

  return protocol + path.resolve(startPath, url);
}

function findSourceMapUrl(source: string): string | null {
  const fileContent = readFile(source);

  if (fileContent == null) {
    return null;
  }

  let lastMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;

  SOURCE_MAPPING_URL_REGEXP.lastIndex = 0;
  while ((match = SOURCE_MAPPING_URL_REGEXP.exec(fileContent)) != null) {
    lastMatch = match;
  }

  return lastMatch == null ? null : (lastMatch[1] ?? lastMatch[2] ?? null);
}

// Jest writes each map to a path derived from the file's contents, the
// transform config and the transformer's own cache key, so the path is already
// content-addressed: an edit or a config change produces a different one and
// the stale entry is never asked for again. That makes it safe to keep parsed
// maps for the lifetime of the process rather than re-reading and re-parsing
// them for every test file a worker runs.
const parsedByCachePath = new Map<string, TraceMap | null>();

// Every test file gets a fresh registry, but a worker moves on to the next file
// while a stray timer from the previous one can still throw. Remember where each
// generated file's map lived so those frames stay resolvable. The path is
// content-addressed, so a remembered entry can only ever answer for a file the
// live registry has never heard of.
const rememberedMapPaths = new Map<string, string>();

function parseMap(content: string): TraceMap | null {
  try {
    // `AnyMap` rather than `TraceMap`, which throws on the indexed maps that
    // bundlers emit as a top-level `sections` array.
    return AnyMap(content);
  } catch {
    return null;
  }
}

function parseRegisteredMap(sourceMapPath: string): TraceMap | null {
  const cached = parsedByCachePath.get(sourceMapPath);

  if (cached !== undefined) {
    return cached;
  }

  const content = readFile(sourceMapPath);
  const map = content == null ? null : parseMap(content);

  parsedByCachePath.set(sourceMapPath, map);

  return map;
}

export class SourceMapCache {
  private readonly sourceMaps: SourceMapRegistry | null;
  private readonly loaded = new Map<string, LoadedSourceMap | null>();
  private readonly attempted = new Map<string, string | undefined>();

  constructor(sourceMaps: SourceMapRegistry | null) {
    this.sourceMaps = sourceMaps;
  }

  get(generatedPath: string): LoadedSourceMap | null {
    const cached = this.loaded.get(generatedPath);
    const registered = this.sourceMaps?.get(generatedPath);

    // The registry fills in as files are transformed, so a file looked up
    // before its map was registered must not stay unmapped for the rest of the
    // run. Retry only when it now points somewhere new: a map that failed to
    // load would otherwise be re-read for every frame naming the file, and the
    // runtime empties the registry at teardown, where an entry going away must
    // not throw away a map already loaded — stacks are still formatted then.
    const isStale =
      registered != null && this.attempted.get(generatedPath) !== registered;

    if (cached !== undefined && !isStale) {
      return cached;
    }

    const loaded = this.load(generatedPath);

    this.loaded.set(generatedPath, loaded);
    this.attempted.set(generatedPath, registered);

    return loaded;
  }

  private load(generatedPath: string): LoadedSourceMap | null {
    // The map Jest itself produced while transforming the file.
    const registered = this.sourceMaps?.get(generatedPath);

    if (registered != null && registered !== '') {
      rememberedMapPaths.set(generatedPath, registered);
    }

    const sourceMapPath =
      registered != null && registered !== ''
        ? registered
        : rememberedMapPaths.get(generatedPath);

    if (sourceMapPath != null && sourceMapPath !== '') {
      const map = parseRegisteredMap(sourceMapPath);

      return map == null ? null : {map, url: generatedPath};
    }

    const rawMap = this.readAdjacent(generatedPath);

    if (rawMap == null) {
      return null;
    }

    const map = parseMap(rawMap.content);

    return map == null ? null : {map, url: rawMap.url};
  }

  // A `sourceMappingURL` comment on a file Jest did not transform, which covers
  // pre-compiled output shipping its own map.
  private readAdjacent(
    generatedPath: string,
  ): {content: string; url: string} | null {
    const sourceMapUrl = findSourceMapUrl(generatedPath);

    if (sourceMapUrl == null) {
      return null;
    }

    if (INLINE_SOURCE_MAP_REGEXP.test(sourceMapUrl)) {
      const base64 = sourceMapUrl.slice(sourceMapUrl.indexOf(',') + 1);

      return {
        content: Buffer.from(base64, 'base64').toString(),
        url: generatedPath,
      };
    }

    const resolvedUrl = resolveRelativeTo(generatedPath, sourceMapUrl);
    const content = readFile(resolvedUrl);

    return content == null ? null : {content, url: resolvedUrl};
  }
}

const cachesByRegistry = new WeakMap<SourceMapRegistry, SourceMapCache>();

// One cache per registry, so the stack trace formatter and `getCallsite` parse
// each `.map` file once between them.
export function getSourceMapCache(
  sourceMaps: SourceMapRegistry | null | undefined,
): SourceMapCache {
  if (sourceMaps == null) {
    return new SourceMapCache(null);
  }

  let cache = cachesByRegistry.get(sourceMaps);

  if (cache == null) {
    cache = new SourceMapCache(sourceMaps);
    cachesByRegistry.set(sourceMaps, cache);
  }

  return cache;
}

// Translate a position in transformed code back to the original source. Returns
// the position unchanged when there is no mapping for it: a precise location in
// the compiled file beats a vague one in the original.
export function mapSourcePosition(
  cache: SourceMapCache,
  position: GeneratedPosition,
): MappedPosition {
  const {column, line, source} = position;

  if (column == null || line == null) {
    return position;
  }

  const sourceMap = cache.get(source);

  if (sourceMap == null) {
    return position;
  }

  const originalPosition = originalPositionFor(sourceMap.map, {column, line});

  if (originalPosition.source == null) {
    return position;
  }

  return {
    column: originalPosition.column,
    line: originalPosition.line,
    name: originalPosition.name,
    source: resolveRelativeTo(sourceMap.url, originalPosition.source),
  };
}
