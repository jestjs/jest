
`expect(value)`
------------

[Jasmine](http://jasmine.github.io/1.3/introduction.html?spec=Included%20matchers%3A%20The%20%27toThrow%27%20matcher%20is%20for%20testing%20if%20a%20function%20throws%20an%20exception.#section-Included_Matchers)
  - `.not` inverse the next comparison
  - `.toThrow(?message)`
  - `.toBe(value)` comparison using `===`
  - `.toEqual(value)` deep comparison. Use [`jasmine.any(type)`](http://jasmine.github.io/1.3/introduction.html#section-Matching_Anything_with_<code>jasmine.any</code>) to be softer
  - `.toBeFalsy()`
  - `.toBeTruthy()`
  - `.toBeNull()`
  - `.toBeUndefined()`
  - `.toBeDefined()`
  - `.toMatch(regexp)`
  - `.toContain(string)`
  - `.toBeCloseTo(number, delta)`
  - `.toBeGreaterThan(number)`
  - `.toBeLessThan(number)`

(Jest)
  - `.toBeCalled()`
  - `.toBeCalledWith(arg, um, ents)`
  - `.lastCalledWith(arg, um, ents)`
  


`it.only()`: executes only this test. Very useful when investigating a failure
