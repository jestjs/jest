import Prando from 'prando';

export const rngBuilder = (seed: number) => new Prando(seed);

// Fisher-Yates shuffle
// This is performed in-place
export default function shuffleArray<T>(
  array: Array<T>,
  random: () => number = Math.random,
): Array<T> {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  while (++index < length) {
    const rand = index + Math.floor(random() * (lastIndex - index + 1));
    const value = array[index];
    array[index] = array[rand];
    array[rand] = value;
  }
  return array;
}
