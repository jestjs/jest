---
id: automatic-mocking
title: Automatic Mocking
layout: docs
category: Core Concepts
permalink: docs/automatic-mocking.html
next: api
---

In order to write an effective unit test, you want to be able to isolate a unit
of code and test only that unit – nothing else. It is fairly common and good
practice to consider a module such a unit, and this is where Jest excels. Jest
makes isolating a module from its dependencies extremely easy by automatically
generating mocks for each of the module's dependencies and providing those mocks
(rather than the real dependency modules) by default.

Let's look at a concrete example:

```javascript
// CurrentUser.js
let userID = 0;
module.exports = {
  getID() {
    return userID;
  },
  setID(id) {
    userID = id;
  }
};
```

```javascript
// login.js
const CurrentUser = require('./CurrentUser.js');
```

If we run `login.js` with node, Jest will not become involved at all and the
program will execute as you'd normally expect. However, if you run a unit test
for the `login.js` file, Jest takes over and modifies `require()` such that the
code behaves in the following way:

```javascript
const CurrentUser = {
  getID: jest.fn(),
  setID: jest.fn()
};
```

With this setup, you cannot accidentally rely on the implementation details of
`CurrentUser.js` when testing `login.js` because all of the calls to the
`CurrentUser` module are mocked. Additionally, testing becomes easier in
practice because you don't have to write any boilerplate in your tests to
setup mock objects for the dependencies you don't want to test.

How does it work?
-----------------

Jest actually implements its own version of the `require()` function in the
testing environment. Jest's custom `require()` function loads the real module,
inspects what it looks like, and then makes a mocked version based on what it
saw and returns that.

This means Jest is going to give you an object with the same shape as the real
module, but with mocks for each of the exported values instead of the real
values.

The automatic mocking system is also aware of classes/constructor functions
with custom prototypes:

```javascript
// User.js
function User() {
  this.name = null;
}
User.prototype.setName = function(name) {
  this.name = name;
};

// createCouple.js
const User = require('./User.js');

function createCouple(nameA, nameB) {
  const userA = new User();
  userA.setName(nameA);

  const userB = new User();
  userB.setName(nameB);

  return [userA, userB];
}
module.export = createCouple;
```

In this example, you can instantiate the mocked version of the constructor
using `new` (just like you'd normally do), and all of the methods will also be
mock functions as you would expect:

```
// __tests__/createCouple-test.js
jest.unmock('../createCouple.js');
const createCouple = require('../createCouple.js');

const couple = createCouple('userA', 'userB');
expect(couple[0].setName.mock.calls.length).toEqual(1);
expect(couple[1].setName.mock.calls.length).toEqual(1);
```

An interesting detail to note is that while functions in the prototype are
normally shared across all instances, mock functions are not – they are
generated for each instance.

Conclusion
----------

A good goal to aim for when designing a system is to provide an API that is easy
to use for 90% of use cases, while leaving the ability to accomplish the last
10% as well. In the case of Jest, automated mocking solves the rather
uninteresting (but common) task of writing boilerplate to generate mocks for
the unit you are testing. However, it is still possible to have complete control
over what is mocked and what is not by providing `jest.mock()` and
`jest.unmock()` APIs for customization.

Additionally, there are times where the automated mocking system isn't able to
generate a mock that's sufficient enough for your needs. In these cases, you
can [manually write a mock](/jest/docs/manual-mocks.html) that Jest should use
(rather than trying to infer one itself).
