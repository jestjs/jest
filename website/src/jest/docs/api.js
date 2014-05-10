/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"API.js","id":"api","title":"APIs","layout":"docs","category":"Reference","permalink":"api.html","previous":"timer-mocks","next":"blog-post","href":"/jest/docs/api.html"}}, `
## Runtime APIs
-----

#### The \`jest\` object

  - [\`jest.genMockFunction()\`/\`.genMockFn()\`](#jest-genmockfunction)
  - \`jest.dontMock(module)\`
  - \`jest.mock(module)\`
  - \`jest.autoMockOff()\`
  - \`jest.autoMockOn()\`
  - \`jest.genMockFromModule()\`
  - \`jest.runTimersRepeatedly()\`
  - \`jest.runTimersOnce()\`
  - \`jest.runTicksRepeatedly()\` helper for promises
  - \`jest.clearTimers()\`

#### Mock function objects
  - \`.mockImplementation(fn)\`
  - \`.mockReturnThis()\`
  - \`.mockReturnValue(value)\`
  - \`.mockReturnValueOnce(value)\`
  - \`.mock\`

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

#### Globally injected variables

  - \`jest\`
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

-----
### \`jest.autoMockOff()\`
<<TODO>>

### \`jest.autoMockOn()\`
<<TODO>>

### \`jest.clearAllTimers()\`
<<TODO>>

### \`jest.dontMock(moduleName)\`
<<TODO>>

### \`jest.genMockFromModule(moduleObj)\`
<<TODO>>

### \`jest.genMockFunction()\`
<<TODO>>

### \`jest.genMockFn()\`
<<TODO>>

### \`jest.mock(moduleName)\`
<<TODO>>

### \`jest.runAllTicks()\`
<<TODO>>

### \`jest.runAllTimers()\`
<<TODO>>

### \`jest.runOnlyPendingTimers()\`
<<TODO>>

### \`jest.setMock(moduleName, moduleExports)\`
<<TODO>>
`);
  }
});
