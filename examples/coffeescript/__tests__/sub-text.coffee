jest
  .dontMock '../sub'

describe 'sub', ->
  it 'subtracts 5 - 1 to equal 4 in CoffeeScript', ->
    sub = require '../sub'
    expect(sub 5, 1).toBe 4
