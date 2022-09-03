// Mulberry 32 taken from
// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
export function mulberry32(seed: number): {next: () => number} {
  let state = seed;

  function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {next};
}

export const rngBuilder = mulberry32;

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
