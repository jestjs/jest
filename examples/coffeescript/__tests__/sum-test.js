jest.dontMock '../sum.js'

describe 'sum', ->
  it 'adds 1 + 1 to equal 2', ->
    sum = require '../sum.js'
    console.log sum
    expect(sum 1, 2).toBe 3
