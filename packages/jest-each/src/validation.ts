/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as pico from 'picocolors';
import type {Global} from '@jest/types';
import {format as pretty} from 'pretty-format';

type TemplateData = Global.TemplateData;

const EXPECTED_COLOR = pico.green;
const RECEIVED_COLOR = pico.red;

export const validateArrayTable = (table: unknown): void => {
  if (!Array.isArray(table)) {
    throw new TypeError(
      '`.each` must be called with an Array or Tagged Template Literal.\n\n' +
        `Instead was called with: ${pretty(table, {
          maxDepth: 1,
          min: true,
        })}\n`,
    );
  }

  if (isTaggedTemplateLiteral(table)) {
    if (isEmptyString(table[0])) {
      throw new Error(
        'Error: `.each` called with an empty Tagged Template Literal of table data.\n',
      );
    }

    throw new Error(
      'Error: `.each` called with a Tagged Template Literal with no data, remember to interpolate with ${expression} syntax.\n',
    );
  }

  if (isEmptyTable(table)) {
    throw new Error(
      'Error: `.each` called with an empty Array of table data.\n',
    );
  }
};

const isTaggedTemplateLiteral = (array: any) => array.raw !== undefined;
const isEmptyTable = (table: Array<unknown>) => table.length === 0;
const isEmptyString = (str: string | unknown) =>
  typeof str === 'string' && str.trim() === '';

export const validateTemplateTableArguments = (
  headings: Array<string>,
  data: TemplateData,
): void => {
  const incompleteData = data.length % headings.length;
  const missingData = headings.length - incompleteData;

  if (incompleteData > 0) {
    throw new Error(
      `Not enough arguments supplied for given headings:\n${EXPECTED_COLOR(
        headings.join(' | '),
      )}\n\n` +
        `Received:\n${RECEIVED_COLOR(pretty(data))}\n\n` +
        `Missing ${RECEIVED_COLOR(missingData.toString())} ${pluralize(
          'argument',
          missingData,
        )}`,
    );
  }
};

const pluralize = (word: string, count: number) =>
  word + (count === 1 ? '' : 's');

const START_OF_LINE = '^';
const NEWLINE = '\\n';
const HEADING = '\\s*[^\\s]+\\s*';
const PIPE = '\\|';
const REPEATABLE_HEADING = `(${PIPE}${HEADING})*`;
const HEADINGS_FORMAT = new RegExp(
  START_OF_LINE + NEWLINE + HEADING + REPEATABLE_HEADING + NEWLINE,
  'g',
);

export const extractValidTemplateHeadings = (headings: string): string => {
  const matches = headings.match(HEADINGS_FORMAT);
  if (matches === null) {
    throw new Error(
      `Table headings do not conform to expected format:\n\n${EXPECTED_COLOR(
        'heading1 | headingN',
      )}\n\nReceived:\n\n${RECEIVED_COLOR(pretty(headings))}`,
    );
  }

  return matches[0];
};
