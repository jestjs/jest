export default function pluralize(word: string, count: number, ending: string) {
  return `${count} ${word}${count === 1 ? '' : ending}`;
}
