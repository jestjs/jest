/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"API.js","id":"api","title":"API","layout":"docs","category":"Reference","permalink":"api.html","previous":"native-mocks","next":"jest-config","href":"/jest/docs/api.html"}}, `---

\`expect(value)\`
------------

[Jasmine](http://jasmine.github.io/1.3/introduction.html?spec=Included%20matchers%3A%20The%20%27toThrow%27%20matcher%20is%20for%20testing%20if%20a%20function%20throws%20an%20exception.#section-Included_Matchers)

  - \`.not\` inverse the next comparison
  - \`.toThrow(?message)\`
  - \`.toBe(value)\` comparison using \`===\`
  - \`.toEqual(value)\` deep comparison. Use [\`jasmine.any(type)\`](http://jasmine.github.io/1.3/introduction.html#section-Matching_Anything_with_<code>jasmine.any</code>) to be softer
  - \`.toBeFalsy()\`
  - \`.toBeTruthy()\`
  - \`.toBeNull()\`
  - \`.toBeUndefined()\`
  - \`.toBeDefined()\`
  - \`.toMatch(regexp)\`
  - \`.toContain(string)\`
  - \`.toBeCloseTo(number, delta)\`
  - \`.toBeGreaterThan(number)\`
  - \`.toBeLessThan(number)\`

(Jest)

  - \`.toBeCalled()\`
  - \`.toBeCalledWith(arg, um, ents)\`
  - \`.lastCalledWith(arg, um, ents)\`


Global variables
----------------

(Jasmine)

  - \`describe(name, fn)\`
  - \`it(name, fn)\`
  - \`beforeEach(fn)\`
  - \`afterEach(fn)\`

(Jest)

  - \`it.only(name, fn)\` executes [only](https://github.com/davemo/jasmine-only) this test in the suite. Very useful when investigating a failure
  - \`pit(name, fn)\` helpers for [promises](https://www.npmjs.org/package/jasmine-pit)


The `jest` object
-----------------------

  - \`.getMockFunction()\`
  - \`.dontMock(module)\`
  - \`.mock(module)\`
  - \`.autoMockOff()\`
  - \`.autoMockOn()\`
`);
  }
});
