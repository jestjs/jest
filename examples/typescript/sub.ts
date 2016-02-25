const sum = require('./sum');

function sub(a: number, b: number): number {
  return sum(a, -b);
}

export = sub;
