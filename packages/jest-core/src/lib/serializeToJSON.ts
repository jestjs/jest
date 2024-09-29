/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * When we're asked to give a JSON output with the --json flag or otherwise,
 * some data we need to return don't serialize well with a basic
 * `JSON.stringify`, particularly Errors returned in `.openHandles`.
 *
 * This function handles the extended serialization wanted above.
 */
export default function serializeToJSON(
  value: any,
  space?: string | number,
): string {
  return JSON.stringify(
    value,
    (_, value) => {
      // There might be more in Error, but pulling out just the message, name,
      // and stack should be good enough
      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name,
          stack: value.stack,
        };
      }
      return value;
    },
    space,
  );
}
