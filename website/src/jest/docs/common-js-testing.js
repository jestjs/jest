/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"CommonJSTesting.js","id":"common-js-testing","title":"Common JS Testing","layout":"docs","category":"Core Concepts","permalink":"common-js-testing.html","previous":"tutorial","next":"auto-mocks","href":"/jest/docs/common-js-testing.html"}}, `
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

In this case, the solution to both concepts is to use the global object. It works, but it's not ideal for reasons outlined in this article: [Brittle Global State & Singletons](http://misko.hevery.com/code-reviewers-guide/flaw-brittle-global-state-singletons/).


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

But it's a pain to thread these constructor arguments through a real application. So Angular uses \`injector\` behind the scenes, that makes it easy to create instances that automatically acquire their dependencies.

\`\`\`
var injectedDoWork = injector.instantiate(doWork);

// is the equivalent of writing

function injectedDoWork() {
  var XHR = injector.get('XHR');
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
\`\`\`

Angular inspects the function and sees that it has one argument called \`XHR\`. It then provides the value \`injector.get('XHR')\` for the variable \`XHR\`.

In order to have a function to be testable by Angular, you have to write your code in this specific way and pass it through a function before being able to use it.


How does Jest solve this problem?
---------------------------------

Angular is using arguments as a way to model dependencies and has to implement its own module loader. Most large JavaScript applications already use a module loader with the \`require\` function. In a CommonJS JavaScript app, the example above would really look like this:

\`\`\`
var XHR = require('XHR');
function doWork() {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
\`\`\`

The interesting aspect of this code is that the dependency on \`XHR\` is already intermediated by \`require\`. The idea of Jest is to use this as a seam for inserting test doubles by implementing a special \`require\` in the testing environment.

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

Dependency Injection is a very powerful tool that lets you swap the implementation of any module at any time. However, the vast majority of the time you just have one implementation for production and one for testing. Jest is optimized for this specific use case.

Jest provides the same ability to mock a dependency as Angular but instead of coming up with its custom module loader, it uses CommonJS. This enables you to test all the existing code that uses CommonJS out there without having to heavily refactor it to make it compatible with Angular's module system.

The best part is that since Angular code has been designed to be tested without any specific testing environment, you can also test Angular code using Jest.
`);
  }
});
