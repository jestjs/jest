import chalk = require('chalk');
import {
  isKindDeleted,
  isKindEqual,
  isKindInserted,
  isKindUnequalType,
} from './diffObject';
import {
  DiffObject,
  Format,
  FormatOptions,
  FormatOptionsNormalized,
  Line,
  LineType,
} from './types';
import {formatCircularDiff, isWrappedCircular} from './complex/circularObjects';
import getType = require('jest-get-type');
import {normalizeDiffOptions} from './normalizeDiffOptions';
import {formatObjectDiff} from './complex/object';
import {formatMapDiff} from './complex/map';
import {formatArrayDiff} from './complex/array';
import {formatPrimitiveDiff, formatStringDiff} from './primitives';
import {createDeletedLine, createInsertedLine, formatUpdated} from './line';

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
    const serializedVal = line.skipSerialize
      ? `${line.val}`
      : opts.serialize(line.val);

    const formattedLineContent =
      ' ' +
      addIntendation(line.prefix + serializedVal + line.suffix, line.indent);

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
    if (plugin.test(diff.a) || plugin.test(diff.b)) {
      return plugin.format(diff, context, opts, formatDiff);
    }
  }

  if (isKindUnequalType(diff.kind)) {
    return formatUpdated(diff.a, diff.b, context);
  }

  if (isKindInserted(diff.kind)) {
    return [createInsertedLine(diff.b, context)];
  }

  if (isKindDeleted(diff.kind)) {
    return [createDeletedLine(diff.a, context)];
  }

  if (isWrappedCircular(diff.a) || isWrappedCircular(diff.b)) {
    return formatCircularDiff(diff, context, opts);
  }

  const aType = getType(diff.a);
  switch (aType) {
    case 'number':
    case 'boolean':
    case 'function':
      return formatPrimitiveDiff(diff, context, opts);
    case 'string':
      return formatStringDiff(diff, context, opts);
    case 'array':
      return formatArrayDiff(
        diff as DiffObject<Array<unknown>>,
        context,
        opts,
        formatDiff,
      );
    case 'map':
      return formatMapDiff(
        diff as DiffObject<Map<unknown, unknown>>,
        context,
        opts,
        formatDiff,
      );
    case 'object':
      return formatObjectDiff(
        diff as DiffObject<Record<PropertyKey, unknown>>,
        context,
        opts,
        formatDiff,
      );
  }

  throw Error('ooppsie ');
};

function format(
  diff: DiffObject<unknown, unknown>,
  options: FormatOptions = {},
) {
  const normalizedOptions = normalizeDiffOptions(options);
  if (isKindEqual(diff.kind)) {
    return chalk.dim('Compared values have no visual difference.');
  }

  if (isKindUnequalType(diff.kind)) {
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
        {plugins: normalizedOptions.plugins},
      ),
      normalizedOptions,
    )
  );
}

export default format;
