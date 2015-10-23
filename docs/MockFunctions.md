---
id: mock-functions
title: Mock functions
layout: docs
category: Reference
permalink: docs/mock-functions.html
next: manual-mocks
---

Mock functions make it easy to test the links between code by erasing the actual
implementation of a function, capturing calls to the function (and the
parameters passed in those calls), capturing instances of constructor functions
when instantiated with `new`, and allowing test-time configuration of return
values.

There are two ways to get your hands on a mock functions: Either by
`require()`ing a mocked component (See [Automatic Mocking](/jest/docs/automatic-mocking.html))
or by explicitly requesting one from `jest.genMockFunction()` in your test:

```javascript
var myMock = jest.genMockFunction();
myMock('1');
myMock('a', 'b');
console.log(myMock.mock.calls);
> [ [1], ['a', 'b'] ]
```

## `.mock` property

All mock functions have this special `.mock` property, which is where data about
how the function has been called is kept. The `.mock` property also tracks the
value of `this` for each call, so it is possible to inspect this as well:

```javascript
var myMock = jest.genMockFunction();

var a = new myMock();
var b = {};
var bound = myMock.bind(b);
bound();

console.log(myMock.mock.instances);
> [ <a>, <b> ]
```

These mock members are very useful in tests to assert how these functions get
called, or instantiated:

```javascript
// The function was called exactly once
expect(someMockFunction.mock.calls.length).toBe(1);

// The first arg of the first call to the function was 'first arg'
expect(someMockFunction.mock.calls[0][0]).toBe('first arg');

// The second arg of the first call to the function was 'second arg'
expect(someMockFunction.mock.calls[0][1]).toBe('second arg');

// This function was instantiated exactly twice
expect(someMockFunction.mock.instances.length).toBe(2);

// The object returned by the first instantiation of this function
// had a `name` property whose value was set to 'test'
expect(someMockFunction.mock.instances[0].name).toEqual('test');
```

## Mock Return Values

Mock functions can also be used to inject test values into your code during a
test:

```javascript
var myMock = jest.genMockFunction();
console.log( myMock() );
> undefined

myMock.mockReturnValueOnce(10)
 .mockReturnValueOnce('x')
 .mockReturnValue(true);

console.log(myMock(), myMock(), myMock(), myMock());
> 10, 'x', true, true
```

Mock functions are also very effective in code that uses a functional
continuation-passing style. Code written in this style helps avoid the need for
complicated stubs that recreate behavior of the real component they're standing
in for, in favor of injecting values directly into the test right before they're
used.

```javascript
var filterTestFn = jest.genMockFunction();

// Make the mock return `true` for the first call,
// and `false` for the second call
filterTestFn
  .mockReturnValueOnce(true)
  .mockReturnValueOnce(false);

var result = [11, 12].filter(filterTestFn);

console.log(result);
> [11]
console.log(filterTestFn.mock.calls);
> [ [11], [12] ]
```

Most real-world examples actually involve getting ahold of a mock function on a
dependent component and configuring that, but the technique is the same. In
these cases, try to avoid the temptation to implement logic inside of any
function that's not directly being tested.

## Mock Implementations

Still, there are cases where it's useful to go beyond the ability to specify
return values and full-on replace the implementation of a mock function. This
can be done with the `mockImplementation` method on mock functions:

```javascript
var myObj = {
  myMethod: jest.genMockFunction().mockImplementation(function() {
    // do something stateful
    return this;
  });
};

myObj.myMethod(1).myMethod(2);
```

For cases where we have methods that are typically chained (and thus always need
to return `this`), we have a sugary API to simplify this in the form of a
`.mockReturnThis()` function that also sits on all mocks:

```javascript
var myObj = {
  myMethod: jest.genMockFunction().mockReturnThis()
};

// is the same as

var myObj = {
  myMethod = jest.genMockFunction().mockImplementation(function() {
    return this;
  });
};
```

## Custom Matchers

Finally, in order to make it simpler to assert how mock functions have been
called, we've added some custom matcher functions to jasmine for you:

```javascript
// The mock function was called at least once
expect(mockFunc).toBeCalled();

// The mock function was called at least once with the specified args
expect(mockFunc).toBeCalledWith(arg1, arg2);

// The last call to the mock function was called with the specified args
expect(mockFunc).lastCalledWith(arg1, arg2);
```

These matchers are really just sugar for common forms of inspecting the `.mock`
property. You can always do this manually yourself if that's more to your taste
or if you need to do something more specific:

```jasmine
// The mock function was called at least once
expect(mockFunc.mock.calls.length).toBeGreaterThan(0);

// The mock function was called at least once with the specified args
expect(mockFunc.mock.calls).toContain([arg1, arg2]);

// The last call to the mock function was called with the specified args
expect(mockFunc.mock.calls[mockFunc.mock.calls.length - 1]).toEqual(
  [arg1, arg2]
);

// The first arg of the last call to the mock function was `42`
// (note that there is no sugar helper for this specific of an assertion)
expect(mockFunc.mock.calls[mockFunc.mock.calls.length - 1][0]).toBe(42);
```
