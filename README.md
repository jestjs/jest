# jest

jest is a JavaScript testing library + CLI.

Its goal is to make writing JavaScript unit tests as easy and frictionless as possible while running the tests as fast as possible.

- **All dependencies are mocked by default**. Test only the modules you intend to, but not the interations with modules you don't intend to. Don't do integration testing by mistake.

- **Integrated with require()**. Control the output of `require()` within your test environment. You don't have to refactor your code to use DI to make it testable.

And some goodies:

- **Speed**. Because all the dependencies are mocked and tests run in parallel, tests are running much faster.

- **Using Jasmine**. Jest is dealing with dependencies and test execution, Jasmime actually runs the tests.

- **Used at Facebook**. Thousands of tests are already running under Jest.


## Basic Example

```js
// XHR.js
module.exports = window.XHR;
```

```js
// MyClass.js
var XHR = require('./XHR');

function MyClass() {
  this.doWork = function() {
    var xhr = new XHR();
    xhr.open('GET', 'https://github.com/facebook/jest/', true);
    xhr.send();
  }
}
module.exports = MyClass;
```

```js
// __tests__/MyClass-test.js

// By default, jest will automatically generate a mock version for any module when it is
// require()'d. We tell jest not to mock out the 'MyClass' module so that we can test it.
require('mock-modules').dontMock('../MyClass');

describe('MyClass', function() {
  it('should send a request to github', function() {
    var MyClass = require('../MyClass');
    var XHR = require('../XHR');
    
    new MyClass().doWork();
    
    expect(XHR.mock.instances[0].open).toBeCalledWith(
      'GET',
      'https://github.com/facebook/jest/',
      true
    );
    expect(XHR.mock.instances[0].send).toBeCalled();
  });
});
```
