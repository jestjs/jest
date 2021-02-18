import {traverseArray} from './complex/array';
import {wrapCircularObject} from './complex/circularObjects';
import {traverseObject} from './complex/object';
import {getType, isLeafType} from './getType';
import {
  DeletedDiffObject,
  DiffObject,
  DiffPlugin,
  InsertedDiffObject,
  Kind,
  MarkChildrenRecursivelyWithScopedPlugins,
  Path,
} from './types';

function traverse(a: unknown, f: (val: unknown, key: unknown) => DiffObject) {
  const type = getType(a);

  switch (type) {
    case 'array': {
      return traverseArray(a as Array<unknown>, f);
    }
    case 'object': {
      return traverseObject(a, f);
    }
  }

  throw new Error('oopsie');
}

export function markChildrenRecursively<T = unknown>(
  kind: Kind.INSERTED | Kind.DELETED,
  val: T,
  path: Path,
  refs = new Set(),
  plugins: Array<DiffPlugin>,
): InsertedDiffObject | DeletedDiffObject {
  const markChildrenRecursivelyWithScopedPlugins: MarkChildrenRecursivelyWithScopedPlugins = (
    kind,
    val,
    path,
    refs,
  ) => markChildrenRecursively(kind, val, path, refs, plugins);

  for (const plugin of plugins) {
    if (plugin.test(val)) {
      return plugin.markChildrenRecursively(
        kind,
        val,
        path,
        refs,
        markChildrenRecursivelyWithScopedPlugins,
      );
    }
  }

  if (kind === Kind.INSERTED) {
    if (isLeafType(val)) {
      return {
        b: val,
        kind: Kind.INSERTED,
        path,
      };
    }

    if (refs.has(val)) {
      return {
        b: wrapCircularObject(val),
        kind,
        path,
      };
    }

    refs.add(val);

    return {
      b: val,
      childDiffs: traverse(val, (childVal, childKey) =>
        markChildrenRecursivelyWithScopedPlugins(
          kind,
          childVal,
          childKey,
          refs,
        ),
      ),
      kind,
      path,
    };
  }

  if (isLeafType(val)) {
    return {
      a: val,
      kind,
      path,
    };
  }

  if (refs.has(val)) {
    return {
      a: wrapCircularObject(val),
      kind,
      path,
    };
  }

  refs.add(val);

  return {
    a: val,
    childDiffs: traverse(val, (childVal, childKey) =>
      markChildrenRecursivelyWithScopedPlugins(kind, childVal, childKey, refs),
    ),
    kind,
    path,
  };
}
