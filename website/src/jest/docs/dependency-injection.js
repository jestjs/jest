/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"DependencyInjection.js","id":"dependency-injection","title":"Dependency Injection","layout":"docs","category":"Deep Dive","permalink":"dependency-injection.html","previous":"timer-mocks","next":"api","href":"/jest/docs/dependency-injection.html"}}, `---

Dependency Injection was popularized in the JavaScript community by Angular as a way to mock dependencies in order to make code testable. In this article, we're going to see how Jest achieves the same result using a different approach.

What is the problem?
--------------------

The [example](https://docs.angularjs.org/guide/unit-testing#dependency-injection) that Angular documentation uses to justify Dependency Injection is the following:

\`\`\`javascript
function doWork() {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
\`\`\`

This function has a dependency on the \`XHR\` class and uses the global namespace in order to get a reference to \`XHR\`. In order to mock this dependency, we have to monkey patch the global object.

\`\`\`javascript
var oldXHR = XHR;
XHR = function MockXHR() {};
doWork();
// assert that MockXHR got called with the right arguments
XHR = oldXHR; // if you forget this bad things will happen
\`\`\`

This small example shows two important concepts. We need a way to get a reference to \`XHR\` and a way to provide two implementations: one for the normal execution and one for testing.

In this case, the solution to both concepts is to use the global object. It is working but not ideal for reasons outlined in this article: [Brittle Global State & Singletons](http://misko.hevery.com/code-reviewers-guide/flaw-brittle-global-state-singletons/).


How does Angular solve this problem?
------------------------------------

In Angular, you write your code by passing dependencies as arguments

\`\`\`javascript
function doWork(XHR) {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
\`\`\`

It makes it very easy to write a test, you just pass your mocked version as argument to your function

\`\`\`javascript
var MockXHR = function() {};
doWork(MockXHR);
// assert that MockXHR got called with the right arguments
\`\`\`

When this function is included in an Angular application, it is going to be automatically modified in the following way

\`\`\`
var injectedDoWork = injector.instantiate(doWork);

// is the equivalent of writing

function injectedDoWork() {
  var XHR = injector.get('XHR');
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
\`\`\`

Angular is going to inspect the function and see that it has one argument called \`XHR\`. It is going to provide the value \`injector.get('XHR')\` for the variable \`XHR\`.

In order to have a function to be testable by Angular, you have to write your code in this specific way and pass it through a function before being able to use it.


How does Jest solve this problem?
---------------------------------

If we were to implement the same example using node or any application using CommonJS, it would look like this:

\`\`\`
var XHR = require('XHR');
function doWork() {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
\`\`\`

The interesting aspect of this code is that \`XHR\` dependency is obtained via a call to \`require\`. The idea of Jest is to implement a special \`require\` in a testing environment.

\`\`\`
jest.mock('XHR');
require('XHR'); // returns a mocked version of XHR

jest.dontMock('XHR');
require('XHR'); // returns the real XHR module
\`\`\`

This way, you can write your test like this

\`\`\`
jest.mock('XHR'); // note: this is done automatically
doWork();
var MockXHR = require('XHR');
// assert that MockXHR got called with the right arguments
\`\`\`

Conclusion
----------

By using existing \`require\` calls, Jest can mock dependencies without having to refactor your code. The normal execution flow is also untouched. Wrapping every function to inject dependencies is not entierly free.
`);
  }
});
