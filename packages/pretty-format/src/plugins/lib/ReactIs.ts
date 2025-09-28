/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// This file is mostly copy-pasted from the original react-is library,
// with some modifications to support React versions < 19.
// https://github.com/facebook/react/blob/main/packages/react-is/src/ReactIs.js

// Customizations:
// - Added support for REACT_LEGACY_ELEMENT_TYPE wherever REACT_ELEMENT_TYPE is used.
// - Added support for REACT_PROVIDER_TYPE wherever REACT_CONTEXT_TYPE is used.
// - Added support for REACT_SERVER_CONTEXT_TYPE in typeOf function with the same logic as REACT_CONTEXT_TYPE.
// - Added support for REACT_OFFSCREEN_TYPE in isValidElementType function.
// - TypeScript type `mixed` replaced with `any`.

// Types collected from https://github.com/facebook/react/blob/main/packages/shared/ReactSymbols.js
const REACT_LEGACY_ELEMENT_TYPE: symbol = Symbol.for('react.element');
const REACT_ELEMENT_TYPE: symbol = Symbol.for('react.transitional.element');
const REACT_PORTAL_TYPE: symbol = Symbol.for('react.portal');
const REACT_FRAGMENT_TYPE: symbol = Symbol.for('react.fragment');
const REACT_STRICT_MODE_TYPE: symbol = Symbol.for('react.strict_mode');
const REACT_PROFILER_TYPE: symbol = Symbol.for('react.profiler');
const REACT_CONSUMER_TYPE: symbol = Symbol.for('react.consumer');
const REACT_CONTEXT_TYPE: symbol = Symbol.for('react.context');
const REACT_FORWARD_REF_TYPE: symbol = Symbol.for('react.forward_ref');
const REACT_SUSPENSE_TYPE: symbol = Symbol.for('react.suspense');
const REACT_SUSPENSE_LIST_TYPE: symbol = Symbol.for('react.suspense_list');
const REACT_MEMO_TYPE: symbol = Symbol.for('react.memo');
const REACT_LAZY_TYPE: symbol = Symbol.for('react.lazy');
const REACT_VIEW_TRANSITION_TYPE: symbol = Symbol.for('react.view_transition');
const REACT_CLIENT_REFERENCE: symbol = Symbol.for('react.client.reference');

// Legacy types not present in React 19+
const REACT_PROVIDER_TYPE: symbol = Symbol.for('react.provider');
const REACT_SERVER_CONTEXT_TYPE: symbol = Symbol.for('react.server_context');
const REACT_OFFSCREEN_TYPE: symbol = Symbol.for('react.offscreen');

// Below is a copy of ReactIs.js with customizations listed above.

export function typeOf(object: any): any {
  if (typeof object === 'object' && object !== null) {
    const $$typeof = object.$$typeof;
    switch ($$typeof) {
      case REACT_LEGACY_ELEMENT_TYPE:
      case REACT_ELEMENT_TYPE:
        const type = object.type;

        switch (type) {
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
          case REACT_SUSPENSE_LIST_TYPE:
          case REACT_VIEW_TRANSITION_TYPE:
            return type;
          default:
            const $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_PROVIDER_TYPE:
              case REACT_CONTEXT_TYPE:
              case REACT_SERVER_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
                return $$typeofType;
              case REACT_CONSUMER_TYPE:
                return $$typeofType;
              // Fall through
              default:
                return $$typeof;
            }
        }
      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
}

export const ContextConsumer: symbol = REACT_CONSUMER_TYPE;
export const ContextProvider: symbol = REACT_CONTEXT_TYPE;
export const Element = REACT_ELEMENT_TYPE;
export const ForwardRef = REACT_FORWARD_REF_TYPE;
export const Fragment = REACT_FRAGMENT_TYPE;
export const Lazy = REACT_LAZY_TYPE;
export const Memo = REACT_MEMO_TYPE;
export const Portal = REACT_PORTAL_TYPE;
export const Profiler = REACT_PROFILER_TYPE;
export const StrictMode = REACT_STRICT_MODE_TYPE;
export const Suspense = REACT_SUSPENSE_TYPE;
export const SuspenseList = REACT_SUSPENSE_LIST_TYPE;

export function isValidElementType(type: any): boolean {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  }

  // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).
  if (
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    type === REACT_OFFSCREEN_TYPE
  ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    if (
      type.$$typeof === REACT_LAZY_TYPE ||
      type.$$typeof === REACT_MEMO_TYPE ||
      type.$$typeof === REACT_PROVIDER_TYPE ||
      type.$$typeof === REACT_CONTEXT_TYPE ||
      type.$$typeof === REACT_CONSUMER_TYPE ||
      type.$$typeof === REACT_FORWARD_REF_TYPE ||
      // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      type.$$typeof === REACT_CLIENT_REFERENCE ||
      type.getModuleId !== undefined
    ) {
      return true;
    }
  }

  return false;
}

export function isContextConsumer(object: any): boolean {
  return typeOf(object) === REACT_CONSUMER_TYPE;
}
export function isContextProvider(object: any): boolean {
  return [REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE].includes(typeOf(object));
}
export function isElement(object: any): boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    [REACT_ELEMENT_TYPE, REACT_LEGACY_ELEMENT_TYPE].includes(object.$$typeof)
  );
}
export function isForwardRef(object: any): boolean {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
export function isFragment(object: any): boolean {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
export function isLazy(object: any): boolean {
  return typeOf(object) === REACT_LAZY_TYPE;
}
export function isMemo(object: any): boolean {
  return typeOf(object) === REACT_MEMO_TYPE;
}
export function isPortal(object: any): boolean {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
export function isProfiler(object: any): boolean {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
export function isStrictMode(object: any): boolean {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
export function isSuspense(object: any): boolean {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}
export function isSuspenseList(object: any): boolean {
  return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
}
