import * as ReactIs from 'react-is';
import prettyFormat = require('pretty-format');
import {
  Context,
  CustomDiff,
  CustomFormat,
  DiffObject,
  Format,
  Line,
  LineGenerationOptions,
} from '../types';
import {
  createUnequalType,
  isKindDeleted,
  isKindEqual,
  isKindInserted,
  isKindUnequalType,
} from '../diffObject';
import {
  createCommonLine,
  createDeletedLine,
  createInsertedLine,
  formatUpdated,
} from '../line';

type ReactElement = any;

export const isReactElement = (val: unknown): boolean =>
  val && ReactIs.isElement(val);

export const diff: CustomDiff = (aUnk, bUnk, path, memos, diff) => {
  const a = aUnk as any;
  const b = bUnk as any;
  if (a.type !== b.type) {
    return createUnequalType(a, b, path);
  }
  const propDiffs = diff(a.props, b.props, path, memos);

  return {
    a,
    b,
    childDiffs: propDiffs.childDiffs,
    kind: propDiffs.kind,
    path,
  };
};

const getType = (element: ReactElement) => {
  const type = element.type;
  if (typeof type === 'string') {
    return type;
  }
  if (typeof type === 'function') {
    return type.displayName || type.name || 'Unknown';
  }

  if (ReactIs.isFragment(element)) {
    return 'React.Fragment';
  }
  if (ReactIs.isSuspense(element)) {
    return 'React.Suspense';
  }
  if (typeof type === 'object' && type !== null) {
    if (ReactIs.isContextProvider(element)) {
      return 'Context.Provider';
    }

    if (ReactIs.isContextConsumer(element)) {
      return 'Context.Consumer';
    }

    if (ReactIs.isForwardRef(element)) {
      const functionName = type.render.displayName || type.render.name || '';

      return functionName !== ''
        ? 'ForwardRef(' + functionName + ')'
        : 'ForwardRef';
    }

    if (ReactIs.isMemo(element)) {
      const functionName =
        type.displayName || type.type.displayName || type.type.name || '';

      return functionName !== '' ? 'Memo(' + functionName + ')' : 'Memo';
    }
  }
  return 'UNDEFINED';
};

const formatPropDiffs = (
  diffs: Array<DiffObject>,
  context: Readonly<Context>,
  opts: LineGenerationOptions,
  format: Format,
) => {
  const nextContext: Context = {
    indent: context.indent + '  ',
    sufix: '',
  };
  return diffs.flatMap(diff => {
    nextContext.prefix = `${diff.path}=`;
    if (isKindInserted(diff.kind)) {
      return createInsertedLine(diff.b, nextContext);
    }

    if (isKindDeleted(diff.kind)) {
      return createDeletedLine(diff.a, nextContext);
    }

    return format(diff, nextContext, opts);
  });
};

const getChildrenDiff = (diff: DiffObject) => {
  const children = diff.childDiffs!.filter(({path}) => path === 'children');
  return children.length ? children[0] : undefined;
};

const formatChildrenDiff = (
  diff: DiffObject,
  context: Readonly<Context>,
): Array<Line> => {
  const nextContext: Context = {
    indent: context.indent + '  ',
  };
  if (isKindUnequalType(diff.kind)) {
    return formatUpdated(diff.a, diff.b, nextContext);
  }

  if (diff.childDiffs) return [];

  if (typeof diff.a === 'string') {
    nextContext.skipSerialize = true;
    if (isKindEqual(diff.kind)) {
      return [createCommonLine(diff.a, nextContext)];
    }
    return formatUpdated(diff.a, diff.b as string, nextContext);
  }

  throw new Error('oopsie');
};

export const format: CustomFormat = (diff, context, opts, format) => {
  const a = diff.a as any;
  const type = getType(a);

  const typeOpening = createCommonLine('<' + type, {
    ...context,
    skipSerialize: true,
    sufix: '',
  });
  const propLines = formatPropDiffs(
    diff.childDiffs!.filter(({path}) => path !== 'children'),
    context,
    opts,
    format,
  );
  const endOfTypeOpening = createCommonLine('>', {
    ...context,
    prefix: '',
    skipSerialize: true,
    sufix: '',
  });

  const childrenDiffObjects = getChildrenDiff(diff);
  const childenDiffs = childrenDiffObjects
    ? formatChildrenDiff(childrenDiffObjects, context)
    : [];
  const typeClosing = createCommonLine('</' + type + '>', {
    ...context,
    prefix: '',
    skipSerialize: true,
  });

  return [
    typeOpening,
    ...propLines,
    endOfTypeOpening,
    ...childenDiffs,
    typeClosing,
  ];
};

export default {
  diff,
  format,
  serialize: prettyFormat.plugins.ReactElement.serialize,
  test: isReactElement,
};
