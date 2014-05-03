
`expect(a).`
  - `.not` inverse the next comparison
  - `.toBe(other)` comparison using `===`
  - `.toEqual(other)` deep comparison. `jasmine.any(type)`
  - `.toThrow()`
  - `.toBeCloseTo(e, delta)` floating point comparison
  - `.toBeNull()`
  - `.toBeUndefined()`
  - `.toMatch(regexp)`
  - `.toBeDefined()`
  - `.toContain(substring)`
  - `.toBeFalsy()`
  - `.toBeTruthy()`
  - `.toBeGreaterThan(other)`
  - `.toBeLessThan(other)`

  - `toBeCalledWith` 
  


`it.only()`: executes only this test. Very useful when investigating a failure
