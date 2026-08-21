/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

export function parseDataUri(specifier: string): {
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
