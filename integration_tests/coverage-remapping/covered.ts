// Copyright 2004-present Facebook. All Rights Reserved.

export = function difference(a: number, b: number): number {
    const branch1: boolean = true
      ? 1
      : 0;
    const branch2: boolean = true ? 1 : 0;
    const branch3: boolean = true || true || false;
    const fn: Function = true ? () => null : () => null;

    return a - b;
}
