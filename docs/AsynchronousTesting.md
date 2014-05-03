
We want to test the following function (borrowed from [this great article on testing asynchronous functions](http://martinfowler.com/articles/asyncJS.html)). It does an ajax request to get the current user as JSON, transforms this JSON into a new object and pass it to the callback. Very typical code.

```javascript
// fetchCurrentUser.js
var $ = require('jquery');

function parseUserJson(userJson) {
  return {
    loggedIn: true,
    fullName: userJson.firstName + ' ' + userJson.lastName
  };
};

function fetchCurrentUser(callback) {
  function ajaxDone(userJson) {
    var user = parseUserJson(userJson);
    callback(user);
  };

  return $.ajax({
    type: 'GET',
    url: 'http://example.com/currentUser',
    done: ajaxDone
  });
};

module.exports = fetchCurrentUser;
```

In order to test the function we first need to write a new file along with some boilerplate

```javascript
// __tests__/fetchCurrentUser-test.js
require('jest-runtime').dontMock('../fetchCurrentUser.js');

describe('fetchCurrentUser', function() {
  it('creates a parsed user', function() {
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser.js');

    // ... missing code ...
  });
});
```

We want to make sure that the callback given to `fetchCurrentUser` is correctly executed. In order to do that, we're going to generate a mock function and make sure that it is called with the proper arguments.

```javascript
    var fetchCallback = require('mocks').getMockFunction();
    fetchCurrentUser(fetchCallback);

    // ... missing code ...
    
    expect(fetchCallback).toBeCalledWith({
      loggedIn: true,
      fullName: 'Tomas Jakobsen'
    });
```

In order to compute the result, `fetchCurrentUser` is calling to a dependency: `$.ajax`. To write a proper test we first need to make sure that it is calling that function with the proper arguments.

```javascript
    expect($.ajax).toBeCalledWith({
      type: 'GET',
      url: 'http://example.com/currentUser',
      done: jasmine.any(Function)
    });
```

and then return a mock value for this call

```javascript
    $.ajax.mock.calls[0/*first call*/][0/*first argument*/].done({
      firstName: 'Tomas',
      lastName: 'Jakobsen'
    });
```

Unlike most testing libraries, jest doesn't use a different mode for testing asynchronous functions versus synchronous ones. It gets away with it by mocking everything by default and providing a powerful mock function abstraction.
