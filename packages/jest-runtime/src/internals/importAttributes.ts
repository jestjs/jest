/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ImportAttributes} from './moduleTypes';

// Soft cap so a long-lived validator (watch mode, --runInBand) can't grow the
// warned set without bound. When we hit it we drop everything; users see at
// most one extra repeated warning per pair, which is benign.
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

// Mirrors Node's `validateAttributes` in lib/internal/modules/esm/assert.js.
// The only deliberate divergence: missing `type: 'json'` warns instead of
// throwing — see the JSON branch below. The warned-pairs set lives on the
// instance, so each Runtime (one per test file) warns anew.
export class ImportAttributeValidator {
  private readonly warnedMissingJsonAttributePairs = new Set<string>();

  validate(
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
        if (!this.warnedMissingJsonAttributePairs.has(dedupeKey)) {
          if (this.warnedMissingJsonAttributePairs.size >= MAX_WARNED_PAIRS) {
            this.warnedMissingJsonAttributePairs.clear();
          }
          this.warnedMissingJsonAttributePairs.add(dedupeKey);
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
}
