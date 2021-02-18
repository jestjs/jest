import chalk = require('chalk');
import {formatArrayDiff} from './complex/array';
import {formatCircularDiff, isWrappedCircular} from './complex/circularObjects';
import {formatMapDiff} from './complex/map';
import {formatObjectDiff} from './complex/object';
import {getType} from './getType';
import {createDeletedLine, createInsertedLine} from './line';
import {normalizeDiffOptions} from './normalizeDiffOptions';
import {formatPrimitiveDiff, formatStringDiff} from './primitives';
import {
  DiffObject,
  Format,
  FormatComplexDiffObject,
  FormatOptions,
  FormatOptionsNormalized,
  FormatPrimitiveDiffObject,
  Kind,
  Line,
  LineType,
} from './types';

export const printAnnotation = ({
  aAnnotation,
  aColor,
  aIndicator,
  bAnnotation,
  bColor,
  bIndicator,
  // includeChangeCounts,
  omitAnnotationLines,
}: FormatOptionsNormalized): string => {
  if (omitAnnotationLines) {
    return '';
  }

  const aRest = '';
  const bRest = '';

  return (
    aColor(aIndicator + ' ' + aAnnotation + aRest) +
    '\n' +
    bColor(bIndicator + ' ' + bAnnotation + bRest) +
    '\n\n'
  );
};

const addIntendation = (string: string, padding: string) =>
  string
    .split('\n')
    .map((x, i) => (i !== 0 ? '  ' : '') + padding + x)
    .join('\n');

function print(lines: Array<Line>, opts: FormatOptionsNormalized) {
  // eslint-disable-next-line consistent-return
  function printLine(line: Line) {
    const formattedLineContent =
      ' ' + addIntendation(line.prefix + line.val + line.suffix, line.indent);

    switch (line.type) {
      case LineType.COMMON:
        return opts.commonColor(opts.commonIndicator + formattedLineContent);
      case LineType.INSERTED:
        return opts.bColor(opts.bIndicator + formattedLineContent);
      case LineType.DELETED:
        return opts.aColor(opts.aIndicator + formattedLineContent);
    }
  }

  return lines.map(printLine).join('\n');
}

const formatDiff: Format = (diff, context, opts) => {
  for (const plugin of opts.plugins) {
    if ('a' in diff) {
      if (plugin.test(diff.a)) {
        return plugin.format(diff, context, opts, formatDiff);
      }
    }
    if ('b' in diff) {
      if (plugin.test(diff.b)) {
        return plugin.format(diff, context, opts, formatDiff);
      }
    }
  }

  let type;

  if (diff.kind === Kind.UNEQUAL_TYPE) {
    const deletedLines = formatDiff(
      {
        a: diff.a,
        childDiffs: diff.aChildDiffs,
        kind: Kind.DELETED,
        path: diff.path,
      },
      context,
      opts,
    );
    const insertedLines = formatDiff(
      {
        b: diff.b,
        childDiffs: diff.bChildDiffs,
        kind: Kind.INSERTED,
        path: diff.path,
      },
      context,
      opts,
    );
    return [...deletedLines, ...insertedLines];
  } else if (diff.kind === Kind.INSERTED) {
    type = getType(diff.b);

    if (isWrappedCircular(diff.b)) {
      return formatCircularDiff(diff, context, opts);
    }

    switch (type) {
      case 'number':
      case 'boolean':
      case 'function':
      case 'string':
      case 'undefined':
      case 'null':
      case 'symbol':
        return [createInsertedLine(opts.serialize(diff.b), context)];
    }
  } else if (diff.kind === Kind.DELETED) {
    type = getType(diff.a);

    if (isWrappedCircular(diff.a)) {
      return formatCircularDiff(diff, context, opts);
    }

    switch (type) {
      case 'number':
      case 'boolean':
      case 'function':
      case 'string':
      case 'undefined':
      case 'null':
      case 'symbol':
        return [createDeletedLine(opts.serialize(diff.a), context)];
    }
  } else {
    type = getType(diff.a);

    if (isWrappedCircular(diff.a) || isWrappedCircular(diff.b)) {
      return formatCircularDiff(diff, context, opts);
    }
    switch (type) {
      case 'number':
      case 'boolean':
      case 'function':
      case 'symbol':
        return formatPrimitiveDiff(diff, context, opts);
      case 'string':
        return formatStringDiff(
          diff as FormatPrimitiveDiffObject<string, string>,
          context,
          opts,
        );
    }
  }

  switch (type) {
    case 'array':
      return formatArrayDiff(
        diff as FormatComplexDiffObject<Array<unknown>>,
        context,
        opts,
        formatDiff,
      );
    case 'map':
      return formatMapDiff(
        diff as FormatComplexDiffObject<Map<unknown, unknown>>,
        context,
        opts,
        formatDiff,
      );
    case 'object': {
      return formatObjectDiff(
        diff as FormatComplexDiffObject<Record<PropertyKey, unknown>>,
        context,
        opts,
        formatDiff,
      );
    }
  }

  throw new Error(`unknown type: ${type}`);
};

function format(
  diff: DiffObject<unknown, unknown>,
  options: FormatOptions = {},
): string {
  const normalizedOptions = normalizeDiffOptions(options);
  if (diff.kind === Kind.EQUAL) {
    return normalizedOptions.commonColor(
      'Compared values have no visual difference.',
    );
  }

  if (diff.kind === Kind.UNEQUAL_TYPE) {
    diff;
    return (
      '  Comparing two different types of values.' +
      ` Expected ${chalk.green(getType(diff.a))} but ` +
      `received ${chalk.red(getType(diff.b))}.`
    );
  }

  const header = printAnnotation(normalizedOptions);

  return (
    header +
    print(
      formatDiff(
        diff,
        {indent: '', prefix: '', sufix: ''},
        {
          plugins: normalizedOptions.plugins,
          serialize: normalizedOptions.serialize,
        },
      ),
      normalizedOptions,
    )
  );
}

export default format;
