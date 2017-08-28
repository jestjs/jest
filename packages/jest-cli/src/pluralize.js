const pluralize = (word: string, count: number, ending: string) =>
  `${count} ${word}${count === 1 ? '' : ending}`;

module.exports = pluralize;
