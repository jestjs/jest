/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AnyMap,
  type SectionedSourceMapInput,
  type TraceMap,
  originalPositionFor,
} from '@jridgewell/trace-mapping';
import {mapFileCommentRegex} from 'convert-source-map';
import type {SourceMapFileReader, SourceMapRegistry} from './types';

type ReportUnparsable = (mapPath: string, generatedPath: string) => void;

export interface GeneratedPosition {
  column: number | null;
  line: number | null;
  source: string;
}

export interface MappedPosition extends GeneratedPosition {
  name?: string | null;
}

// The *last* sourceMappingURL wins, so one inside a comment or a string does
// not shadow the real one.
function findSourceMapUrl(fileContent: string): string | null {
  const lastMatch = [...fileContent.matchAll(mapFileCommentRegex)].at(-1);

  return lastMatch == null ? null : (lastMatch[1] ?? lastMatch[2] ?? null);
}

function resolveUrl(url: string, base: string): string | null {
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

// Map paths are content-addressed, so a stale one is never asked for again and
// a parsed map can live for the whole process. The base URL joins the key
// because it is baked into the resolved sources, and a transformer with its
// own `getCacheKey` can hand two generated files the same map path.
const parsedByCachePath = new Map<string, TraceMap | null>();

// A worker moves on to the next test file while a stray timer from the
// previous one can still throw; remembering where each file's map lived keeps
// those frames resolvable. `null` marks a file transformed more than one way —
// as ESM and as CJS, say — where a frame does not say which map it came from,
// so decline rather than guess.
const rememberedMapPaths = new Map<string, string | null>();

// `mapUrl` is what the map's `sources` resolve against.
function parseMap(
  content: SectionedSourceMapInput,
  mapUrl: string,
): TraceMap | null {
  try {
    // `AnyMap` rather than `TraceMap`, which throws on the indexed maps that
    // bundlers emit as a top-level `sections` array.
    return AnyMap(content, mapUrl);
  } catch {
    return null;
  }
}

export class SourceMapCache {
  private readonly sourceMaps: SourceMapRegistry | null;
  private readonly reader: SourceMapFileReader;
  private readonly reportUnparsable: ReportUnparsable;
  private readonly loaded = new Map<string, TraceMap | null>();
  private readonly attempted = new Map<string, string | undefined>();

  constructor(
    sourceMaps: SourceMapRegistry | null,
    reader: SourceMapFileReader,
    reportUnparsable: ReportUnparsable,
  ) {
    this.sourceMaps = sourceMaps;
    this.reader = reader;
    this.reportUnparsable = reportUnparsable;
  }

  get(generatedPath: string): TraceMap | null {
    const cached = this.loaded.get(generatedPath);
    const registered = this.sourceMaps?.get(generatedPath);

    // The registry fills in lazily, so a file looked up before its map was
    // registered must not stay unmapped. Retry only when the entry points
    // somewhere new: a map that failed to load would otherwise be re-read for
    // every frame, and the runtime empties the registry at teardown while
    // stacks are still being formatted — an entry going away must not drop a
    // loaded map.
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

  // A mapped source comes back as a URL, which is not what a stack frame should
  // show for a file on disk.
  toDisplayPath(url: string): string {
    return this.reader.toPath(url);
  }

  private load(generatedPath: string): TraceMap | null {
    // The map Jest itself produced while transforming the file.
    const registered = this.sourceMaps?.get(generatedPath);

    if (registered != null && registered !== '') {
      const remembered = rememberedMapPaths.get(generatedPath);

      rememberedMapPaths.set(
        generatedPath,
        remembered === undefined || remembered === registered
          ? registered
          : null,
      );
    }

    const sourceMapPath =
      registered != null && registered !== ''
        ? registered
        : rememberedMapPaths.get(generatedPath);

    if (sourceMapPath != null && sourceMapPath !== '') {
      return this.parseRegisteredMap(sourceMapPath, generatedPath);
    }

    return this.readAdjacent(generatedPath);
  }

  private parseRegisteredMap(
    sourceMapPath: string,
    generatedPath: string,
  ): TraceMap | null {
    // Jest's transform writes the map to its cache directory, but the sources
    // it names are relative to the file that was transformed.
    const mapUrl = this.reader.toUrl(generatedPath);
    const cacheKey = `${sourceMapPath}\0${mapUrl}`;
    const cached = parsedByCachePath.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const content = this.reader.read(sourceMapPath);
    const map = content == null ? null : parseMap(content, mapUrl);

    if (content != null && map == null) {
      this.reportUnparsable(sourceMapPath, generatedPath);
    }

    parsedByCachePath.set(cacheKey, map);

    return map;
  }

  // A `sourceMappingURL` comment on a file Jest did not transform, which covers
  // pre-compiled output shipping its own map.
  private readAdjacent(generatedPath: string): TraceMap | null {
    const fileContent = this.reader.read(generatedPath);

    // A frame can name a `data:` URL — a dynamic `import()` of one — and what
    // that decodes to is not a file a `sourceMappingURL` comment sits on.
    if (typeof fileContent !== 'string') {
      return null;
    }

    const sourceMapUrl = findSourceMapUrl(fileContent);

    if (sourceMapUrl == null) {
      return null;
    }

    const generatedUrl = this.reader.toUrl(generatedPath);
    const resolvedUrl = resolveUrl(sourceMapUrl, generatedUrl);

    if (resolvedUrl == null) {
      return null;
    }

    const isInline = resolvedUrl.startsWith('data:');
    const content = this.reader.read(resolvedUrl);

    if (content == null) {
      // A `data:` URL that fails to decode is a broken inline map; a missing
      // `.map` file next to the code is not worth reporting.
      if (isInline) {
        this.reportUnparsable(generatedPath, generatedPath);
      }

      return null;
    }

    // An inline map's sources are relative to the file carrying it. Every other
    // map resolves them against wherever the map itself lives.
    const mapUrl = isInline ? generatedUrl : resolvedUrl;
    const map = parseMap(content, mapUrl);

    if (map == null) {
      this.reportUnparsable(
        isInline ? generatedPath : this.reader.toPath(resolvedUrl),
        generatedPath,
      );
    }

    return map;
  }
}

// Returns the position unchanged when nothing maps to it: a precise location
// in the compiled file beats a vague one in the original.
export function mapSourcePosition(
  cache: SourceMapCache,
  position: GeneratedPosition,
): MappedPosition {
  const {column, line, source} = position;

  // The tracer throws on out-of-range needles, and a throw inside
  // `prepareStackTrace` replaces the whole stack with the exception.
  if (column == null || line == null || column < 0 || line < 1) {
    return position;
  }

  const map = cache.get(source);

  if (map == null) {
    return position;
  }

  const originalPosition = originalPositionFor(map, {column, line});

  if (originalPosition.source == null) {
    return position;
  }

  return {
    column: originalPosition.column,
    line: originalPosition.line,
    name: originalPosition.name,
    source: cache.toDisplayPath(originalPosition.source),
  };
}
