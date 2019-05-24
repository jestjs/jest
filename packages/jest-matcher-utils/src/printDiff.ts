import {Diff, DIFF_EQUAL, DIFF_DELETE, DIFF_INSERT} from './cleanupSemantic';
import {INVERTED_COLOR} from './index';

export const getDiffString = (diffs: Array<Diff>, op: number): string => {
  const hasEqual = diffs.some(
    diff => diff[0] === DIFF_EQUAL && diff[1].length !== 0,
  );

  return diffs.reduce(
    (reduced: string, diff: Diff): string =>
      reduced +
      (diff[0] === DIFF_EQUAL
        ? diff[1]
        : diff[0] !== op
        ? ''
        : hasEqual
        ? INVERTED_COLOR(diff[1])
        : diff[1]),
    '',
  );
};

export const getExpectedString = (diffs: Array<Diff>): string =>
  getDiffString(diffs, DIFF_DELETE);

export const getReceivedString = (diffs: Array<Diff>): string =>
  getDiffString(diffs, DIFF_INSERT);

export const MULTILINE_REGEXP = /\n/;
