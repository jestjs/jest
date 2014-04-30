# jest

jest is a JavaScript testing library + CLI.

Its goal is to make writing JavaScript unit tests as easy and frictionless as possible while running the tests as fast as possible.

- **All dependencies are mocked by default**. Test only the modules you intend to, nothing more. Don't do integration testing by mistake.

- **Integrated with require()**. Easily control the output of `require()` within your test environment. You don't have to refactor your code to use injection (including DI) in order to make it testable.

- **Uses `jsdom` to mock out DOM APIs for you**. Test node programs \*and\* browser programs using the same test runner!

And some goodies:

- **Speed**. Because most of the dependencies are mocked and tests run in parallel, test execution is incredibly fast.

- **Using Jasmine**. jest deals with dependencies and test execution, but Jasmine actually runs the tests.

- **Used extensively at Facebook**. jest runs thousands of tests at Facebook and has proven itself stable and fast.

## Getting Started

Getting started with jest is pretty simple. All you need to do is:

* Write some (jasmine) tests in a `__tests__` directory
* Add the following two things to your `package.json`
* Run `npm test`:

```js
{
  ...
  "devDependencies": {
    "jest-cli": "*"
  },
  "scripts": {
    "test": "jest"
  }
  ...
}
```

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
