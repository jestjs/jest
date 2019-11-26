/**
 * This file is intentionally created for marking external matchers with
 * an explicit function call in the stack trace, benefiting the inline snapshot
 * system to correctly strip out user defined code when trying to locate the
 * top frame. This is required for custom inline snapshot matchers to work.
 */
export default function noop<T>(any: T): T {
  return any;
}
