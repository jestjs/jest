# @jest/source-map

Applies source maps to stack traces, so a failing test points at the code you wrote rather than at the code Jest ran.

This is a module used internally by Jest. It exists because `--enable-source-maps` and `module.setSourceMapsSupport()` do not cover code compiled through `vm`, which is how Jest evaluates test files, and because Node offers no way to register a map for a filename — Jest serves maps from its own transform pipeline rather than from `sourceMappingURL` comments on disk.

## Install

```sh
$ npm install --save @jest/source-map
```

## API

### `SourceMapSupport#install(sourceMaps?: SourceMapRegistry | null, options?: SourceMapSupportInstallOptions): void`

Replaces `Error.prepareStackTrace` in the current realm, so reading `.stack` on any error renders frames against the original sources. `jest-runner` holds one instance per worker and installs once per test file.

`sourceMaps` maps a transformed file to the `.map` file Jest wrote into its transform cache — inside Jest, `runtime.getSourceMaps()`. The `sources` inside a map resolve with URL semantics against the transformed file, not against the map's own location. Files missing from the registry fall back to a `sourceMappingURL` comment on the file itself, which covers pre-compiled output that ships its own map.

```javascript
import {SourceMapSupport} from '@jest/source-map';

const sourceMapSupport = new SourceMapSupport();
sourceMapSupport.install(new Map([['/build/app.js', '/cache/app.js.map']]));

new Error('boom').stack;
// Error: boom
//     at greet (/src/app.ts:12:9)
```

The formatter stays installed for the lifetime of the process, and each call swaps in a new registry. Nothing is restored, deliberately: an error thrown after a test finishes — a stray timer, a floating promise — is the one users have the hardest time placing, and it would otherwise report a position in the transformed file.

A map that cannot be parsed is reported once via `console.warn`; pass `{suppressWarnings: true}` to turn that off.

### `SourceMapSupport#getCallsite(level: number, sourceMaps?: SourceMapRegistry | null): CallSite`

Returns a single remapped [`CallSite`](https://v8.dev/docs/stack-trace-api#customizing-stack-traces), `level` frames above the caller. Used for `--testLocationInResults`. Shares its parsed maps with the installed formatter, so each `.map` file is read once.

### `getCallsite(level: number, sourceMaps?: SourceMapRegistry | null): CallSite`

Deprecated free-function alias of `SourceMapSupport#getCallsite`.

### `SourceMapRegistry`

`Map<string, string>` — transformed file path to source map path.

## Function names are chosen for readability, not for the spec

A frame is named after the source map's `name` at the frame's **own** position. That name is the identifier being _called_ there rather than the enclosing function, so every frame gets annotated with the call on its line:

```
at Object.toBeTruthy (assertionCount.test.js:12:17)
at Object.setTimeout (inside.js:9:3)
```

The spec-correct reading takes the name from the _caller's_ position instead. It is what [`source-map-support@0.5.14`](https://github.com/evanw/node-source-map-support/pull/253) switched to, and it collapses the frames above to `Object.<anonymous>`, because V8 has no name of its own for a module-level frame. Positions are identical either way — only names differ, and only where V8 could not name the frame.

This package optimises for reading a test failure, so it keeps the annotation. If you need the spec semantics, `getCallsite` hands back a `CallSite` you can map yourself.
