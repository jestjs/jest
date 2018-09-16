const sum = require('./sum').default;

function sub(a: number, b: number): number {
  return sum(a, -b);
}

export default sub;
