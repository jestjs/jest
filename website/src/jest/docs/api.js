/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"API.js","id":"api","title":"API","layout":"docs","category":"Reference","permalink":"api.html","previous":"timer-mocks","href":"/jest/docs/api.html"}}, `---

#### \`jest\`

  - \`.genMockFunction()\` with alias \`.genMockFn()\`
    - \`.mockImplementation(fn)\`
    - \`.mockReturnThis()\`
    - \`.mockReturnValue(value)\`
    - \`.mockReturnValueOnce(value)\`
    - \`.mock\`
      - \`.instances\`
      - \`.calls\`
  - \`.dontMock(module)\`
  - \`.mock(module)\`
  - \`.autoMockOff()\`
  - \`.autoMockOn()\`
  - \`.genMockFromModule()\`
  - \`.runTimersRepeatedly()\`
  - \`.runTimersOnce()\`
  - \`.runTicksRepeatedly()\` helper for promises
  - \`.clearTimers()\`

#### \`expect(value)\`

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
  - \`.toBeCalled()\`
  - \`.toBeCalledWith(arg, um, ents)\`
  - \`.lastCalledWith(arg, um, ents)\`

#### Global variables

  - \`require(module)\`
  - \`describe(name, fn)\`
  - \`beforeEach(fn)\`
  - \`afterEach(fn)\`
  - \`it(name, fn)\`
  - \`it.only(name, fn)\` executes [only](https://github.com/davemo/jasmine-only) this test. Useful when investigating a failure
  - \`pit(name, fn)\` [helper](https://www.npmjs.org/package/jasmine-pit) for promises

#### package.json

  - \`jest\`
    - \`projectName\`
    - \`testPathDirs\`
    - \`testPathIgnores\`
    - \`moduleLoaderPathIgnores\`
`);
  }
});
