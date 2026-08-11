/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TraceMap, originalPositionFor} from '@jridgewell/trace-mapping';
import {existsSync, readFileSync} from 'graceful-fs';
import type {SourceMapRegistry} from './types';

export type GeneratedPosition = {
  column: number | null;
  line: number | null;
  source: string;
};

export type MappedPosition = GeneratedPosition & {
  name?: string | null;
};

type LoadedSourceMap = {
  map: TraceMap;
  url: string;
};

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

// Resolve a URL relative to a directory, keeping any protocol prefix intact.
function resolveRelativeTo(from: string, url: string): string {
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

export class SourceMapCache {
  private readonly sourceMaps: SourceMapRegistry | null;
  private readonly loaded = new Map<string, LoadedSourceMap | null>();

  constructor(sourceMaps: SourceMapRegistry | null) {
    this.sourceMaps = sourceMaps;
  }

  get(generatedPath: string): LoadedSourceMap | null {
    const cached = this.loaded.get(generatedPath);

    if (cached !== undefined) {
      return cached;
    }

    const loaded = this.load(generatedPath);

    this.loaded.set(generatedPath, loaded);

    return loaded;
  }

  clear(): void {
    this.loaded.clear();
  }

  private load(generatedPath: string): LoadedSourceMap | null {
    const rawMap =
      this.readRegistered(generatedPath) ?? this.readAdjacent(generatedPath);

    if (rawMap == null) {
      return null;
    }

    try {
      return {map: new TraceMap(rawMap.content), url: rawMap.url};
    } catch {
      return null;
    }
  }

  // The map Jest itself produced while transforming the file.
  private readRegistered(
    generatedPath: string,
  ): {content: string; url: string} | null {
    const sourceMapPath = this.sourceMaps?.get(generatedPath);

    if (sourceMapPath == null || sourceMapPath === '') {
      return null;
    }

    const content = readFile(sourceMapPath);

    return content == null ? null : {content, url: generatedPath};
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
