import util from 'util';
import pretty from 'pretty-format';

import {ArrayTable, Col, EachTests, Row, Table} from '../bind';

const SUPPORTED_PLACEHOLDERS = /%[sdifjoOp%]/g;
const PRETTY_PLACEHOLDER = '%p';
const INDEX_PLACEHOLDER = '%#';

export default (title: string, arrayTable: ArrayTable): EachTests =>
  normaliseTable(arrayTable).map((row, index) => ({
    title: formatTitle(title, row, index),
    arguments: row,
  }));

const normaliseTable = (table: ArrayTable): Table =>
  isTable(table) ? (table as Table) : (table as Row).map(colToRow);

const isTable = (table: ArrayTable): boolean => table.every(Array.isArray);

const colToRow = (col: Col): Row => [col];

const formatTitle = (title: string, row: Row, rowIndex: number): string =>
  row.reduce<string>((formattedTitle, value) => {
    const [placeholder] = getMatchingPlaceholders(formattedTitle);
    if (!placeholder) return formattedTitle;

    if (placeholder === PRETTY_PLACEHOLDER)
      return interpolatePrettyPlaceholder(formattedTitle, value);

    return util.format(formattedTitle, value);
  }, interpolateTitleIndex(title, rowIndex));

const getMatchingPlaceholders = (title: string) =>
  title.match(SUPPORTED_PLACEHOLDERS) || [];

const interpolateTitleIndex = (title: string, index: number) =>
  title.replace(INDEX_PLACEHOLDER, index.toString());

const interpolatePrettyPlaceholder = (title: string, value: unknown) =>
  title.replace(PRETTY_PLACEHOLDER, pretty(value, {maxDepth: 1, min: true}));
