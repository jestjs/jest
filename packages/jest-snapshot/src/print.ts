import diff from 'jest-diff';
import getType, {isPrimitive} from 'jest-get-type';
import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  getLabelPrinter,
  printDiffOrStringify,
} from 'jest-matcher-utils';

const isLineDiffable = (received: any): boolean => {
  const receivedType = getType(received);

  if (isPrimitive(received)) {
    return false;
  }

  if (
    receivedType === 'date' ||
    receivedType === 'function' ||
    receivedType === 'regexp'
  ) {
    return false;
  }

  if (received instanceof Error) {
    return false;
  }

  if (
    receivedType === 'object' &&
    typeof (received as any).asymmetricMatch === 'function'
  ) {
    return false;
  }

  return true;
};

export const printDiffOrStringified = (
  expectedSerializedTrimmed: string,
  receivedSerializedTrimmed: string,
  received: unknown,
  expectedLabel: string,
  receivedLabel: string,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  if (
    typeof received === 'string' &&
    // Does expected snapshot look like a stringified string:
    expectedSerializedTrimmed.length >= 2 &&
    expectedSerializedTrimmed.startsWith('"') &&
    expectedSerializedTrimmed.endsWith('"')
  ) {
    // 0. Assume leading and trailing newline has been trimmed.
    // 1. Remove enclosing double quote marks.
    // 2. Remove backslash escape preceding backslash here,
    //    because unescape replaced it only preceding double quote mark.
    return printDiffOrStringify(
      expectedSerializedTrimmed.slice(1, -1).replace(/\\\\/g, '\\'),
      received,
      expectedLabel,
      receivedLabel,
      expand,
    );
  }

  if (isLineDiffable(received)) {
    return diff(expectedSerializedTrimmed, receivedSerializedTrimmed, {
      aAnnotation: expectedLabel,
      bAnnotation: receivedLabel,
      expand,
    }) as string;
  }

  const printLabel = getLabelPrinter(expectedLabel, receivedLabel);
  return (
    printLabel(expectedLabel) +
    EXPECTED_COLOR(expectedSerializedTrimmed) +
    '\n' +
    printLabel(receivedLabel) +
    RECEIVED_COLOR(receivedSerializedTrimmed)
  );
};
