sum = (numbers...) ->
  numbers.reduce ((a, b) -> a + b), 0

module.exports = sum
