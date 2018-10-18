import sum from './sum';

function sub(a: number, b: number): number {
  return sum(a, -b);
}

export default sub;
