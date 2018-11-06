// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

export default function pluralize(word: string, count: number, ending: string) {
  return `${count} ${word}${count === 1 ? '' : ending}`;
}
