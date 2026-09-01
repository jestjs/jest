type Multiplier = (value: number) => number;

const triple: Multiplier = value => value * 3;

module.exports = {triple};
