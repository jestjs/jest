// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

const sum = require('./sum');

function sub(a: number, b: number): number {
  return sum(a, -b);
}

export = sub;
