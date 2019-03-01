import pretty from 'pretty-format';
import {isPrimitive} from 'jest-get-type';

type Col = unknown;
type Row = Array<Col>;
type Table = Array<Row>;
type Template = {[key: string]: unknown};
type Templates = Array<Template>;
type Headings = Array<string>;

type X = Array<{
  title: string;
  arguments: Array<unknown>;
}>;

export default (title: string, headings: Headings, row: Row): X => {
  const table = convertRowToTable(row, headings);
  const templates = convertTableToTemplates(table, headings);
  return templates.map(template => ({
    title: interpolate(title, template),
    arguments: [template],
  }));
};

const convertRowToTable = (
  row: Row,
  headings: Headings,
): Table => // TODO: update this type to include values in headings
  Array.from({length: row.length / headings.length}).map((_, index) =>
    row.slice(
      index * headings.length,
      index * headings.length + headings.length,
    ),
  );

const convertTableToTemplates = (table: Table, headings: Headings): Templates =>
  table.map(row =>
    row.reduce<Template>(
      (acc, value, index) => Object.assign(acc, {[headings[index]]: value}),
      {},
    ),
  );

const interpolate = (title: string, template: Template) =>
  Object.keys(template)
    .reduce(getMatchingKeyPaths(title), []) // aka flatMap
    .reduce(replaceKeyPathWithValue(template), title);

const getMatchingKeyPaths = (title: string) => (
  matches: Headings,
  key: string,
) => matches.concat(title.match(new RegExp(`\\$${key}[\\.\\w]*`, 'g')) || []);

const replaceKeyPathWithValue = (template: Template) => (
  title: string,
  match: string,
) => {
  const keyPath = match.replace('$', '').split('.');
  const value = getPath(template, keyPath);

  if (isPrimitive(value)) {
    return title.replace(match, String(value));
  }
  return title.replace(match, pretty(value, {maxDepth: 1, min: true}));
};

const getPath = (
  template: Template | any,
  [head, ...tail]: Array<string>,
): any => {
  if (!head || !template.hasOwnProperty || !template.hasOwnProperty(head))
    return template;
  return getPath(template[head], tail);
};
